"use client";

import { useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import CyberCity from "@/components/three/CyberCity";
import CityBuildings from "@/components/three/CityBuildings";
import InfoPanel from "@/components/three/InfoPanel";
import { parseGitHubUrl, fetchRepoData } from "@/lib/github";

import { buildCityLayout, BuildingData, RoadData, DistrictData } from "@/lib/cityLayout";
import { fetchFileContent, streamFileExplanation } from "@/lib/ai";

export default function Home() {
  const [url, setUrl] = useState("");
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [roads, setRoads] = useState<RoadData[]>([]);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Info panel state
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [explanation, setExplanation] = useState("");
  const [fileCode, setFileCode] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Store owner/repo for file fetching
  const [repoInfo, setRepoInfo] = useState<{ owner: string; repo: string } | null>(null);

  async function handleGenerate() {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setError("Invalid GitHub URL. Try: https://github.com/owner/repo");
      return;
    }

    setLoading(true);
    setError("");
    setBuildings([]);
    setRoads([]);
    setDistricts([]);
    setSelectedBuilding(null);
    setExplanation("");

    try {
      // Guarantee at least 3.5 seconds of loading time for the epic sun transition
      const [repoData] = await Promise.all([
        fetchRepoData(parsed.owner, parsed.repo),
        new Promise(resolve => setTimeout(resolve, 3500))
      ]);
      
      const cityData = buildCityLayout(repoData.files);
      setBuildings(cityData.buildings);
      setRoads(cityData.roads);
      setDistricts(cityData.districts);
      setRepoInfo({ owner: parsed.owner, repo: parsed.repo });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Called when a building is clicked in 3D
  const handleSelectBuilding = useCallback((data: BuildingData) => {
    setSelectedBuilding(data);
    setExplanation("");
    setFileCode("");
    setIsAnalyzing(false);
  }, []);

  // Called when "Analyze ->" is clicked on the info panel
  const handleBuildingClick = useCallback(
    async (data: BuildingData) => {
      if (!repoInfo) return;

      setExplanation("");
      setFileCode("");
      setIsAnalyzing(true);

      try {
        // 1. Fetch the actual file content from GitHub
        const content = await fetchFileContent(
          repoInfo.owner,
          repoInfo.repo,
          data.filePath
        );
        setFileCode(content);

        // 2. Stream Claude's explanation word by word
        await streamFileExplanation(
          data.fileName,
          content,
          (chunk) => {
            // Append each chunk to explanation as it streams
            setExplanation((prev) => prev + chunk);
          },
          () => {
            setIsAnalyzing(false);
          }
        );
      } catch (err) {
        console.error(err);
        setExplanation(
          `Error analyzing file: ${err instanceof Error ? err.message : "Unknown error"}`
        );
        setIsAnalyzing(false);
      }
    },
    [repoInfo]
  );

  function handleClosePanel() {
    setSelectedBuilding(null);
    setExplanation("");
    setFileCode("");
    setIsAnalyzing(false);
  }

  return (
    <main style={{ 
      width: "100vw", 
      height: "100vh", 
      position: "relative", 
      display: "flex", 
      overflow: "hidden", 
      backgroundColor: "#06001a",
    }}>
      <LoadingOverlay loading={loading} />
      
      {/* Main Content Area */}
      <div style={{ flex: 1, position: "relative" }}>
        
        {/* Project Info & Input UI (Terminal Style, No Card) */}
        <AnimatePresence>
          {!repoInfo && !loading && (
            <motion.div
              initial={{ opacity: 0, y: "-40%", x: "-50%" }}
              animate={{ opacity: 1, y: "-50%", x: "-50%" }}
              exit={{ opacity: 0, y: "-60%", x: "-50%" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                zIndex: 10,
                width: "100%",
                maxWidth: "1200px",
                maxHeight: "calc(100vh - 140px)",
                overflowY: "auto",
                padding: "40px",
                background: "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}
            >
            <div className="subheading-container" style={{
              fontSize: "2rem",
              margin: "0 0 16px 0",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: "default"
            }}
            >
              {"Visualize Your Codebase".split("").map((c, i) => <span key={'v'+i} className="hover-char">{c === ' ' ? '\u00A0' : c}</span>)}
            </div>
            
            <h1 style={{
              fontSize: "6rem",
              margin: "0 0 16px 0",
              fontWeight: 900,
              lineHeight: "1.1",
              letterSpacing: "0.5px",
              filter: "drop-shadow(0 15px 25px rgba(255, 102, 0, 0.4))",
              WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)",
              maskImage: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)",
              cursor: "default"
            }}
            >
              {"Every file is a building.".split("").map((c, i) => <span key={'a'+i} className="hover-char">{c === ' ' ? '\u00A0' : c}</span>)}
              <br/>
              {"Every folder is a district.".split("").map((c, i) => <span key={'b'+i} className="hover-char">{c === ' ' ? '\u00A0' : c}</span>)}
            </h1>
            
            <p className="description-container" style={{
              fontSize: "1.6rem",
              fontWeight: "bold",
              margin: "0 0 32px 0",
              lineHeight: "1.6",
              letterSpacing: "1px",
            }}>
              {"Paste a repo and watch your code become a city.".split("").map((c, i) => <span key={'p'+i} className="hover-char">{c === ' ' ? '\u00A0' : c}</span>)}
            </p>
            
            <div style={{ width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} style={{ width: "100%" }}>
              <div className="rainbow-border-wrap" style={{ display: "flex", alignItems: "center" }}>
                <div className="border-spinner"></div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "1rem",
                    padding: url ? "12px 140px 12px 20px" : "12px 20px",
                    outline: "none",
                    letterSpacing: "1px",
                    transition: "all 0.3s ease",
                  }}
                  autoComplete="off"
                  spellCheck="false"
                  disabled={loading}
                  onFocus={(e) => { e.target.parentElement?.classList.add('focused'); }}
                  onBlur={(e) => { e.target.parentElement?.classList.remove('focused'); }}
                />
                <AnimatePresence>
                  {url && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 10 }}
                      transition={{ duration: 0.2 }}
                      type="submit"
                      disabled={loading}
                      style={{
                        position: "absolute",
                        right: "6px",
                        background: "linear-gradient(to right, #ffcc00, #ff6600, #ff0088)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                        padding: "8px 16px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        opacity: loading ? 0.7 : 1,
                        transition: "all 0.2s ease",
                        zIndex: 10,
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 102, 0, 0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {loading ? "PROCESSING..." : "GENERATE"}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </form>
            
            {error && !repoInfo && (
              <div
                style={{
                  width: "100%",
                  color: "#E52F20",
                  fontSize: "14px",
                  background: "rgba(4, 8, 16, 0.9)",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "1px solid #E52F20",
                  boxShadow: "0 0 20px rgba(229, 47, 32, 0.2)",
                  marginTop: "-10px",
                }}
              >
                {error}
              </div>
            )}
            </div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Input UI for when city is loaded */}
        {repoInfo && (
          <div
            style={{
              position: "absolute",
              top: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="https://github.com/owner/repo"
              style={{
                width: "340px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #004346",
                background: "rgba(4, 8, 16, 0.8)",
                color: "#01949A",
                fontSize: "14px",
                outline: "none",
                backdropFilter: "blur(8px)",
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #01949A",
                background: loading
                  ? "rgba(1, 148, 154, 0.1)"
                  : "rgba(1, 148, 154, 0.2)",
                color: "#01949A",
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Building..." : "Generate City"}
            </button>
          </div>
        )}



        {/* Error message */}
        {error && repoInfo && (
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              color: "#E52F20",
              fontSize: "14px",
              background: "rgba(4, 8, 16, 0.9)",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "1px solid #E52F20",
              boxShadow: "0 0 20px rgba(229, 47, 32, 0.2)",
            }}
          >
            {error}
          </div>
        )}

        {/* 3D Canvas */}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          filter: !repoInfo ? "brightness(0.65)" : "none", // Removed blur
          transition: "filter 1s ease",
        }}>
          <Canvas
            camera={{ position: [0, 8, 40], fov: 50 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              powerPreference: "high-performance",
            }}
          >
            <ambientLight intensity={1.2} color="#1a0033" />
            <pointLight position={[0,  80, 0]}    color="#aa00ff" intensity={3}   distance={400} />
            <pointLight position={[80, 50, 80]}   color="#ff00cc" intensity={2}   distance={300} />
            <pointLight position={[-60,40,-60]}   color="#6600ff" intensity={1.5} distance={300} />

            {(() => {
              const displayBuildings = buildings;
              const displayRoads = roads;
              const displayDistricts = districts;
              
              if (!repoInfo) {
                // On Homepage, just render the ground, sun, and stars. No buildings.
                return <CyberCity gridSize={180} buildings={[]} roads={[]} districts={[]} isHomepage={true} loading={loading} />;
              }

              let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
              displayBuildings.forEach(b => {
                if (b.x - b.width / 2 < minX) minX = b.x - b.width / 2;
                if (b.x + b.width / 2 > maxX) maxX = b.x + b.width / 2;
                if (b.z - b.depth / 2 < minZ) minZ = b.z - b.depth / 2;
                if (b.z + b.depth / 2 > maxZ) maxZ = b.z + b.depth / 2;
              });
              let gridSize = Math.max(maxX - minX, maxZ - minZ) + 20;
              if (gridSize < 180) gridSize = 180; // Ensure camera is not engulfed by fog!
              
              return (
                <CyberCity gridSize={gridSize} buildings={displayBuildings} roads={displayRoads} districts={displayDistricts} isHomepage={false} loading={loading} />
              );
            })()}
            <CityBuildings
              buildings={buildings}
              onBuildingClick={handleSelectBuilding}
            />
          </Canvas>
          
          {/* Sunset edge glow and blur on the sides */}
          {!repoInfo && (
            <div style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: "linear-gradient(to right, rgba(120, 0, 200, 0.18) 0%, transparent 22%, transparent 78%, rgba(120, 0, 200, 0.18) 100%)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              maskImage: "linear-gradient(to right, black 0%, transparent 22%, transparent 78%, black 100%)",
              WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 22%, transparent 78%, black 100%)",
              zIndex: 5
            }} />
          )}
        </div>
        
        {/* AI Info Panel */}
        {repoInfo && (
          <InfoPanel
            building={selectedBuilding}
            explanation={explanation}
            fileCode={fileCode}
            isLoading={isAnalyzing}
            onClose={handleClosePanel}
            onAnalyze={() => selectedBuilding && handleBuildingClick(selectedBuilding)}
          />
        )}
      </div>
    </main>
  );
}
