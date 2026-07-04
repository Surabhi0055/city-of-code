"use client";

import { useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import CyberCity from "@/components/three/CyberCity";
import CityBuildings from "@/components/three/CityBuildings";
import { parseGitHubUrl, fetchRepoData } from "@/lib/github";
import { buildCityLayout, BuildingData } from "@/lib/cityLayout";

export default function Home() {
  const [url, setUrl] = useState("");
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(
    null,
  );

  async function handleGenerate() {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      setError("Invalid GitHub URL. Try: https://github.com/owner/repo");
      return;
    }

    setLoading(true);
    setError("");
    setBuildings([]);
    setSelectedBuilding(null);

    try {
      const repoData = await fetchRepoData(parsed.owner, parsed.repo);
      const cityData = buildCityLayout(repoData.files);
      setBuildings(cityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
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

      {/* Selected building info panel */}
      {selectedBuilding && (
        <div
          style={{
            position: "absolute",
            right: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            width: "280px",
            background: "rgba(0, 0, 0, 0.8)",
            border: "1px solid #00ffff44",
            borderRadius: "12px",
            padding: "20px",
            backdropFilter: "blur(12px)",
            color: "#00ffff",
            fontFamily: "monospace",
          }}
        >
          <p
            style={{ fontSize: "11px", color: "#ffffff88", margin: "0 0 4px" }}
          >
            {selectedBuilding.folderName}/
          </p>
          <p
            style={{
              fontSize: "15px",
              fontWeight: 500,
              margin: "0 0 12px",
              color: "#ffffff",
            }}
          >
            {selectedBuilding.fileName}
          </p>
          <p style={{ fontSize: "12px", color: "#ffffff66", margin: 0 }}>
            {(selectedBuilding.fileSize / 1024).toFixed(1)} KB
          </p>
          <button
            onClick={() => setSelectedBuilding(null)}
            style={{
              marginTop: "16px",
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #00ffff44",
              background: "transparent",
              color: "#00ffff88",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            close
          </button>
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
        {/* Lighting — brighter so buildings and roads are clearly visible */}
        <ambientLight intensity={3} color="#1a1a3a" />
        <directionalLight position={[50, 80, 50]} color="#ffffff" intensity={2} />
        <pointLight position={[0, 40, 0]}    color="#00ffff" intensity={5} distance={300} />
        <pointLight position={[80, 30, 80]}  color="#ff00ff" intensity={3} distance={200} />
        <pointLight position={[-30, 30, 80]} color="#4400ff" intensity={2} distance={200} />

        {(() => {
          if (buildings.length === 0) {
            return <CyberCity gridSize={80} buildings={[]} />;
          }
          let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
          buildings.forEach(b => {
            if (b.x - b.width / 2 < minX) minX = b.x - b.width / 2;
            if (b.x + b.width / 2 > maxX) maxX = b.x + b.width / 2;
            if (b.z - b.depth / 2 < minZ) minZ = b.z - b.depth / 2;
            if (b.z + b.depth / 2 > maxZ) maxZ = b.z + b.depth / 2;
          });
          const gridSize = Math.max(maxX - minX, maxZ - minZ) + 20;
          return <CyberCity gridSize={gridSize} buildings={buildings} />;
        })()}
        <CityBuildings
          buildings={buildings}
          onBuildingClick={setSelectedBuilding}
        />
      </Canvas>
    </main>
  );
}
