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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            style={{
              position: "absolute",
              top: "45%",
              left: "50%",
              // Since we are animating 'y', we can't use transform for centering easily without conflicting with motion's transform.
              // So we use framer-motion's 'x' and 'y' properties to handle the -50% centering.
              x: "-50%",
              y: "-50%",
              zIndex: 10,
              width: "90%",
              maxWidth: "800px",
              maxHeight: "calc(100vh - 140px)",
              overflowY: "auto",
              background: "rgba(10, 15, 30, 0.7)",
              backdropFilter: "blur(12px)",
              padding: "40px",
              borderRadius: "24px",
              border: "none",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center"
            }}
          >
            <div style={{
              fontSize: "1rem",
              margin: "0 0 16px 0",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "linear-gradient(to right, #00ffff, #3b82f6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Visualize Your Codebase
            </div>
            
            <h1 style={{
              fontSize: "3.2rem",
              margin: "0 0 16px 0",
              fontWeight: "bold",
              lineHeight: "1.15",
              letterSpacing: "0.5px",
              background: "linear-gradient(to bottom, #ffcc00, #ff6600, #ff0088)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 15px 25px rgba(255, 102, 0, 0.4))",
            }}>
              Every file is a building.<br/> Every folder is a district.
            </h1>
            
            <p style={{
              fontSize: "1.1rem",
              color: "rgba(255, 255, 255, 0.7)",
              margin: "0 0 32px 0",
              lineHeight: "1.6",
            }}>
              Paste a repo and watch your code become a city.
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} style={{ width: "100%", position: "relative" }}>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                style={{
                  width: "100%",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(0, 255, 255, 0.3)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "1.2rem",
                  padding: "16px 24px",
                  outline: "none",
                  letterSpacing: "1px",
                  transition: "all 0.3s ease",
                }}
                autoComplete="off"
                spellCheck="false"
                disabled={loading}
                onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 15px rgba(59, 130, 246, 0.3)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(0, 255, 255, 0.3)"; e.target.style.boxShadow = "none"; }}
              />
            </form>

            {/* Actions */}
            <div style={{ marginTop: "24px", width: "100%" }}>
              <button
                onClick={() => handleGenerate()}
                disabled={loading || !url}
                style={{
                  width: "100%",
                  background: "linear-gradient(to right, #00ffff, #3b82f6, #ec4899)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  padding: "16px",
                  cursor: (loading || !url) ? "not-allowed" : "pointer",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  opacity: (loading || !url) ? 0.5 : 1,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading && url) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(236, 72, 153, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {loading ? "PROCESSING..." : "GENERATE CITY"}
              </button>
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
        {error && (
          <div
            style={{
              position: "absolute",
              top: repoInfo ? "80px" : "calc(50% + 140px)",
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
