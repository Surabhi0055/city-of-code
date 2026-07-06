"use client";

import { useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import CyberCity from "@/components/three/CyberCity";
import CityBuildings from "@/components/three/CityBuildings";
import InfoPanel from "@/components/three/InfoPanel";
import { parseGitHubUrl, fetchRepoData } from "@/lib/github";
import { buildCityLayout, BuildingData, RoadData, DistrictData } from "@/lib/cityLayout";
import { fetchFileContent, streamFileExplanation } from "@/lib/ai";

// Generate dummy data for the background city
const dummyFiles = Array.from({ length: 150 }).map((_, i) => ({
  path: `folder${i % 8}/file${i}.ts`,
  size: 500 + Math.random() * 20000,
  type: "file" as const,
  sha: `dummy-sha-${i}`,
}));
const dummyCity = buildCityLayout(dummyFiles);

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
      const repoData = await fetchRepoData(parsed.owner, parsed.repo);
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
    setIsAnalyzing(false);
  }, []);

  // Called when "Analyze ->" is clicked on the info panel
  const handleBuildingClick = useCallback(
    async (data: BuildingData) => {
      if (!repoInfo) return;

      setExplanation("");
      setIsAnalyzing(true);

      try {
        // 1. Fetch the actual file content from GitHub
        const content = await fetchFileContent(
          repoInfo.owner,
          repoInfo.repo,
          data.filePath
        );

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
    setIsAnalyzing(false);
  }

  return (
    <main style={{ 
      width: "100vw", 
      height: "100vh", 
      position: "relative", 
      display: "flex", 
      overflow: "hidden", 
      backgroundColor: "#040810",
    }}>
      
      {/* Main Content Area */}
      <div style={{ flex: 1, position: "relative" }}>
        
        {/* Project Info & Input UI (Terminal Style, No Card) */}
        {!repoInfo && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              width: "90%",
              maxWidth: "800px",
              fontFamily: "monospace",
            }}
          >
            <div style={{ color: "#ff0088", fontSize: "1.2rem", marginBottom: "8px" }}>
              $ &gt;&gt;
            </div>
            <h1 style={{ color: "#00aaff", fontSize: "2.5rem", margin: "0 0 16px 0", fontWeight: "normal", letterSpacing: "1px" }}>
              Enter GitHub Repository URL to Visualize
            </h1>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "24px" }}>
              <span style={{ color: "#ff0088", fontSize: "1.5rem" }}>&gt;</span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="[https://github.com/username/repo]"
                style={{
                  flex: 1,
                  padding: "16px 0",
                  border: "none",
                  borderBottom: "2px solid #008b8b",
                  background: "transparent",
                  color: "#ff0088",
                  fontSize: "1.5rem",
                  fontFamily: "monospace",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "16px", marginTop: "32px", fontSize: "1.2rem" }}>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  padding: "12px 24px",
                  border: "1px solid #ff0088",
                  background: "transparent",
                  color: "#ff0088",
                  fontFamily: "monospace",
                  fontSize: "1.2rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "rgba(255, 0, 136, 0.2)";
                    e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 0, 136, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {loading ? "[BUILDING...]" : "[GENERATE]"}
              </button>
              
              <div style={{ color: "#008b8b", display: "flex", alignItems: "center" }}>
                | [Examples: `react`, `linux`, `rust`] | [Help]
              </div>
            </div>
            
            <div style={{ color: "#008b8b", marginTop: "24px", fontSize: "1rem" }}>
              [SYSTEM: Awaiting input...] [NET: Connected] [LOC: Cybernet]
            </div>
          </div>
        )}

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

        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(4, 8, 16, 0.9)",
            backdropFilter: "blur(8px)",
            color: "#01949A",
            fontFamily: "monospace",
            gap: "12px",
          }}>
            <div style={{
              width: "50px",
              height: "50px",
              border: "3px solid #004346",
              borderTop: "3px solid #E52F20",
              borderRadius: "50%",
              animation: "spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite",
            }} />
            <p style={{ fontSize: "16px", margin: 0, letterSpacing: "2px" }}>GENERATING CITY...</p>
            <p style={{ fontSize: "12px", color: "#004346", margin: 0 }}>
              FETCHING REPO STRUCTURE
            </p>
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
            camera={{ position: [30, 20, 30], fov: 50 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              powerPreference: "high-performance",
            }}
          >
            <ambientLight intensity={1.5} color="#111a1a" />
            <pointLight position={[0, 80, 0]}    color="#01949A" intensity={3} distance={400} />
            <pointLight position={[80, 50, 80]}  color="#E52F20" intensity={2} distance={300} />
            <pointLight position={[-60, 40, -60]} color="#004346" intensity={1.5} distance={300} />

            {(() => {
              const displayBuildings = buildings.length > 0 ? buildings : dummyCity.buildings;
              const displayRoads = buildings.length > 0 ? roads : dummyCity.roads;
              const displayDistricts = buildings.length > 0 ? districts : dummyCity.districts;
              
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
                <CyberCity gridSize={gridSize} buildings={displayBuildings} roads={displayRoads} districts={displayDistricts} isHomepage={!repoInfo} />
              );
            })()}
            <CityBuildings
              buildings={buildings.length > 0 ? buildings : dummyCity.buildings}
              onBuildingClick={handleSelectBuilding}
            />
          </Canvas>
        </div>
        
        {/* AI Info Panel */}
        {repoInfo && (
          <InfoPanel
            building={selectedBuilding}
            explanation={explanation}
            isLoading={isAnalyzing}
            onClose={handleClosePanel}
            onAnalyze={() => selectedBuilding && handleBuildingClick(selectedBuilding)}
          />
        )}
      </div>
    </main>
  );
}
