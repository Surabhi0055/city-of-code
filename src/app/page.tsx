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
    <main style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Input UI — sits on top of the 3D canvas */}
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
            border: "1px solid #00ffff44",
            background: "rgba(0, 0, 0, 0.7)",
            color: "#00ffff",
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
            border: "1px solid #00ffff",
            background: loading
              ? "rgba(0,255,255,0.1)"
              : "rgba(0,255,255,0.15)",
            color: "#00ffff",
            fontSize: "14px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Building..." : "Generate City"}
        </button>
      </div>

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
          background: "rgba(5, 5, 16, 0.85)",
          backdropFilter: "blur(4px)",
          color: "#00ffff",
          fontFamily: "monospace",
          gap: "12px",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "2px solid #00ffff22",
            borderTop: "2px solid #00ffff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ fontSize: "14px", margin: 0 }}>Generating city...</p>
          <p style={{ fontSize: "12px", color: "#00ffff66", margin: 0 }}>
            Fetching repo structure
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            color: "#ff4444",
            fontSize: "13px",
            background: "rgba(0,0,0,0.7)",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #ff444444",
          }}
        >
          {error}
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [120, 90, 120], fov: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: "high-performance",
        }}
      >
        {/* Lighting — reduced global lighting, removed directional, kept within budget */}
        <ambientLight intensity={1.5} color="#1a1a3a" />
        <pointLight position={[0, 80, 0]}    color="#00ffff" intensity={3} distance={400} />
        <pointLight position={[80, 50, 80]}  color="#ff00ff" intensity={2} distance={300} />
        <pointLight position={[-60, 40, -60]} color="#4400ff" intensity={1.5} distance={300} />

        {(() => {
          if (buildings.length === 0) {
            return (
              <>
                <CyberCity gridSize={80} buildings={[]} roads={[]} districts={[]} />
              </>
            );
          }
          let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
          buildings.forEach(b => {
            if (b.x - b.width / 2 < minX) minX = b.x - b.width / 2;
            if (b.x + b.width / 2 > maxX) maxX = b.x + b.width / 2;
            if (b.z - b.depth / 2 < minZ) minZ = b.z - b.depth / 2;
            if (b.z + b.depth / 2 > maxZ) maxZ = b.z + b.depth / 2;
          });
          const gridSize = Math.max(maxX - minX, maxZ - minZ) + 20;
          return (
            <>
              <CyberCity gridSize={gridSize} buildings={buildings} roads={roads} districts={districts} />
            </>
          );
        })()}
        <CityBuildings
          buildings={buildings}
          onBuildingClick={handleSelectBuilding}
        />
      </Canvas>
      
      {/* AI Info Panel */}
      <InfoPanel
        building={selectedBuilding}
        explanation={explanation}
        isLoading={isAnalyzing}
        onClose={handleClosePanel}
        onAnalyze={() => selectedBuilding && handleBuildingClick(selectedBuilding)}
      />
    </main>
  );
}
