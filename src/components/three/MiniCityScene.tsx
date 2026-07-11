"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Building from "./Building";
import LampPosts from "./LampPosts";
import CityGrid from "./CityGrid";
import { BuildingData, RoadData, DistrictData } from "@/lib/cityLayout";

// ── Demo data — same shape as a real repo build ────────────────────────────────
const DEMO_BUILDINGS: BuildingData[] = [
  { id: "b1",  x:  0,   z:  0,   height: 18, width: 2.2, depth: 2.2, color: "#050510", emissiveColor: "#00ffff", fileName: "page.tsx",        filePath: "src/app/page.tsx",               fileSize: 44000, folderName: "app",        buildingType: "tower" },
  { id: "b2",  x:  6,   z:  0,   height: 14, width: 1.9, depth: 1.9, color: "#050510", emissiveColor: "#d946ef", fileName: "CyberCity.tsx",    filePath: "src/components/CyberCity.tsx",   fileSize: 11700, folderName: "components", buildingType: "tower" },
  { id: "b3",  x: -6,   z:  0,   height: 16, width: 2.0, depth: 2.0, color: "#050510", emissiveColor: "#2563eb", fileName: "Building.tsx",     filePath: "src/components/Building.tsx",    fileSize: 29500, folderName: "components", buildingType: "tower" },
  { id: "b4",  x:  0,   z:  6,   height: 12, width: 1.8, depth: 1.8, color: "#050510", emissiveColor: "#f472b6", fileName: "Navbar.tsx",       filePath: "src/components/Navbar.tsx",      fileSize: 9000,  folderName: "components", buildingType: "tower" },
  { id: "b5",  x:  0,   z: -6,   height: 10, width: 1.7, depth: 1.7, color: "#050510", emissiveColor: "#38bdf8", fileName: "cityLayout.ts",    filePath: "src/lib/cityLayout.ts",          fileSize: 12000, folderName: "lib",        buildingType: "tower" },
  { id: "b6",  x:  6,   z:  6,   height:  7, width: 2.8, depth: 1.8, color: "#050510", emissiveColor: "#9333ea", fileName: "globals.css",      filePath: "src/app/globals.css",            fileSize: 8200,  folderName: "app",        buildingType: "slab"  },
  { id: "b7",  x: -6,   z:  6,   height:  6, width: 2.6, depth: 1.7, color: "#050510", emissiveColor: "#f97316", fileName: "layout.tsx",       filePath: "src/app/layout.tsx",             fileSize: 3000,  folderName: "app",        buildingType: "slab"  },
  { id: "b8",  x:  6,   z: -6,   height:  8, width: 2.5, depth: 1.9, color: "#050510", emissiveColor: "#e11d48", fileName: "CityGrid.tsx",     filePath: "src/components/CityGrid.tsx",    fileSize: 17000, folderName: "components", buildingType: "slab"  },
  { id: "b9",  x: -6,   z: -6,   height:  9, width: 2.4, depth: 1.8, color: "#050510", emissiveColor: "#00ffcc", fileName: "github.ts",        filePath: "src/lib/github.ts",              fileSize: 1500,  folderName: "lib",        buildingType: "block" },
  { id: "b10", x: 12,   z:  0,   height:  5, width: 2.0, depth: 2.0, color: "#050510", emissiveColor: "#ff00cc", fileName: "package.json",     filePath: "package.json",                   fileSize: 2000,  folderName: "root",       buildingType: "block" },
  { id: "b11", x: -12,  z:  0,   height:  4, width: 2.0, depth: 2.0, color: "#050510", emissiveColor: "#4338ca", fileName: "tsconfig.json",    filePath: "tsconfig.json",                  fileSize: 800,   folderName: "root",       buildingType: "block" },
  { id: "b12", x:  0,   z: 12,   height:  6, width: 1.8, depth: 1.8, color: "#050510", emissiveColor: "#22d3ee", fileName: "LampPosts.tsx",    filePath: "src/components/LampPosts.tsx",   fileSize: 3800,  folderName: "components", buildingType: "tower" },
  { id: "b13", x:  0,   z: -12,  height:  5, width: 1.6, depth: 1.6, color: "#050510", emissiveColor: "#fb923c", fileName: "prisma.ts",        filePath: "src/lib/prisma.ts",              fileSize: 600,   folderName: "lib",        buildingType: "tower" },
  { id: "b14", x:  9,   z:  9,   height: 11, width: 1.1, depth: 1.1, color: "#050510", emissiveColor: "#facc15", fileName: "README.md",        filePath: "README.md",                      fileSize: 5000,  folderName: "root",       buildingType: "spire" },
  { id: "b15", x: -9,   z: -9,   height:  9, width: 1.0, depth: 1.0, color: "#050510", emissiveColor: "#a78bfa", fileName: "AGENTS.md",        filePath: "AGENTS.md",                      fileSize: 400,   folderName: "root",       buildingType: "spire" },
  { id: "b16", x: -9,   z:  9,   height:  5, width: 2.2, depth: 1.4, color: "#050510", emissiveColor: "#34d399", fileName: "InfoPanel.tsx",    filePath: "src/components/InfoPanel.tsx",   fileSize: 11500, folderName: "components", buildingType: "slab"  },
  { id: "b17", x:  9,   z: -9,   height:  7, width: 1.8, depth: 2.0, color: "#050510", emissiveColor: "#f0abfc", fileName: "ai.ts",            filePath: "src/lib/ai.ts",                  fileSize: 4000,  folderName: "lib",        buildingType: "tower" },
  { id: "b18", x: 12,   z:  6,   height:  3, width: 1.5, depth: 1.5, color: "#050510", emissiveColor: "#60a5fa", fileName: ".env",             filePath: ".env",                           fileSize: 200,   folderName: "root",       buildingType: "block" },
  { id: "b19", x: -12,  z: -6,   height:  4, width: 1.6, depth: 1.6, color: "#050510", emissiveColor: "#fb7185", fileName: "route.ts",         filePath: "src/app/api/auth/route.ts",      fileSize: 850,   folderName: "api",        buildingType: "tower" },
  { id: "b20", x:  3,   z: -10,  height:  6, width: 1.4, depth: 1.4, color: "#050510", emissiveColor: "#818cf8", fileName: "HomeSkyline.tsx",  filePath: "src/components/HomeSkyline.tsx", fileSize: 5600,  folderName: "components", buildingType: "tower" },
];

const DEMO_ROADS: RoadData[] = [
  { id: "r1", x:  0,  z:  3,   width: 32, length: 1.8, type: "highway", color: "#1a1a2e" },
  { id: "r2", x:  0,  z: -3,   width: 32, length: 1.8, type: "highway", color: "#1a1a2e" },
  { id: "r3", x:  0,  z:  9,   width: 32, length: 1.2, type: "main",    color: "#1a1a2e" },
  { id: "r4", x:  0,  z: -9,   width: 32, length: 1.2, type: "main",    color: "#1a1a2e" },
  { id: "r5", x:  3,  z:  0,   width: 1.8, length: 32, type: "highway", color: "#1a1a2e" },
  { id: "r6", x: -3,  z:  0,   width: 1.8, length: 32, type: "highway", color: "#1a1a2e" },
  { id: "r7", x:  9,  z:  0,   width: 1.2, length: 32, type: "main",    color: "#1a1a2e" },
  { id: "r8", x: -9,  z:  0,   width: 1.2, length: 32, type: "main",    color: "#1a1a2e" },
  { id: "r9",  x: 6,  z:  3,   width: 6,   length: 0.6, type: "alley",  color: "#111"   },
  { id: "r10", x: -6, z:  3,   width: 6,   length: 0.6, type: "alley",  color: "#111"   },
  { id: "r11", x: 6,  z: -3,   width: 6,   length: 0.6, type: "alley",  color: "#111"   },
  { id: "r12", x: -6, z: -3,   width: 6,   length: 0.6, type: "alley",  color: "#111"   },
];

const DEMO_DISTRICTS: DistrictData[] = [
  { id: "d1", x:  0,  z:  0,  w: 16, d: 16, color: "#00ffff" },
  { id: "d2", x: 10,  z:  5,  w: 10, d:  8, color: "#d946ef" },
  { id: "d3", x:-10,  z: -5,  w: 10, d:  8, color: "#2563eb" },
];

export default function DemoCityScene() {
  const gridSize = 150;

  return (
    <Canvas
      camera={{ position: [45, 30, 45], fov: 45 }}
      shadows
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#06001a"]} />
      <fog attach="fog" args={["#06001a", 50, 110]} />

      {/* Lighting — same as main app */}
      <ambientLight intensity={0.12} color="#1a004d" />
      <directionalLight position={[20, 40, 20]} intensity={0.5} color="#6622cc" castShadow />
      <hemisphereLight args={["#110033", "#000011", 0.3]} />
      <pointLight position={[0, 15, 0]} color="#00ffff" intensity={2} distance={50} />

      {/* Interactive orbit — same as main city */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={90}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 5, 0]}
        autoRotate={true}
        autoRotateSpeed={0.6}
      />

      {/* Road grid using the exact same CityGrid component */}
      <CityGrid
        gridSize={gridSize}
        roads={DEMO_ROADS}
        districts={DEMO_DISTRICTS}
        isHomepage={false}
      />

      {/* Street lamps */}
      <LampPosts roads={DEMO_ROADS} />

      {/* Buildings — exact same Building component as the main app */}
      {DEMO_BUILDINGS.map((b) => (
        <Building key={b.id} data={b} onClick={() => {}} />
      ))}

      {/* Starfield */}
      <StarfieldPoints />
    </Canvas>
  );
}

function StarfieldPoints() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 300;
      pos[i * 3 + 1] = 10 + Math.random() * 120;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 300;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.3} sizeAttenuation transparent opacity={0.75} />
    </points>
  );
}
