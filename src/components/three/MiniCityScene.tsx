"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Building from "./Building";
import CityGrid from "./CityGrid";
import { BuildingData, RoadData, DistrictData } from "@/lib/cityLayout";

import { GitHubFile } from "@/lib/github";
import { buildCityLayout } from "@/lib/cityLayout";

// ── Demo data — spread across many folders so every district color fires ───────
const mockFiles: GitHubFile[] = [
  // src/app  → district 0  (cyan)
  { path: "src/app/page.tsx",          size: 45000, type: "blob", sha: "1"  },
  { path: "src/app/layout.tsx",        size:  5000, type: "blob", sha: "2"  },
  { path: "src/app/globals.css",       size: 12000, type: "blob", sha: "3"  },
  { path: "src/app/loading.tsx",       size:  3000, type: "blob", sha: "21" },
  { path: "src/app/error.tsx",         size:  2500, type: "blob", sha: "22" },

  // src/components  → district 1  (blue)
  { path: "src/components/Building.tsx",   size: 28000, type: "blob", sha: "4"  },
  { path: "src/components/CityGrid.tsx",   size: 15000, type: "blob", sha: "5"  },
  { path: "src/components/LampPosts.tsx",  size:  8000, type: "blob", sha: "6"  },
  { path: "src/components/CyberCity.tsx",  size: 18000, type: "blob", sha: "7"  },
  { path: "src/components/Navbar.tsx",     size:  9000, type: "blob", sha: "8"  },
  { path: "src/components/InfoPanel.tsx",  size: 11000, type: "blob", sha: "9"  },
  { path: "src/components/MiniScene.tsx",  size:  7000, type: "blob", sha: "23" },
  { path: "src/components/Modal.tsx",      size:  6500, type: "blob", sha: "24" },

  // src/lib  → district 2  (fuchsia / pink-purple)
  { path: "src/lib/cityLayout.ts", size: 22000, type: "blob", sha: "10" },
  { path: "src/lib/github.ts",     size:  6000, type: "blob", sha: "11" },
  { path: "src/lib/prisma.ts",     size:  3000, type: "blob", sha: "12" },
  { path: "src/lib/ai.ts",         size: 14000, type: "blob", sha: "13" },
  { path: "src/lib/utils.ts",      size:  5000, type: "blob", sha: "25" },

  // src/hooks  → district 3  (sky-blue)
  { path: "src/hooks/useCity.ts",        size:  8000, type: "blob", sha: "26" },
  { path: "src/hooks/useSession.ts",     size:  4000, type: "blob", sha: "27" },
  { path: "src/hooks/useThree.ts",       size:  6000, type: "blob", sha: "28" },

  // src/styles  → district 4  (pastel pink)
  { path: "src/styles/tokens.css",       size:  4500, type: "blob", sha: "29" },
  { path: "src/styles/animations.css",   size:  7000, type: "blob", sha: "30" },

  // src/types  → district 5  (deep indigo)
  { path: "src/types/city.ts",           size:  3500, type: "blob", sha: "31" },
  { path: "src/types/api.ts",            size:  2800, type: "blob", sha: "32" },

  // src/store  → district 6  (rich purple)
  { path: "src/store/cityStore.ts",      size:  9000, type: "blob", sha: "33" },
  { path: "src/store/userStore.ts",      size:  5500, type: "blob", sha: "34" },

  // root config files
  { path: "package.json",   size:  4000, type: "blob", sha: "14" },
  { path: "tsconfig.json",  size:  2000, type: "blob", sha: "15" },
  { path: "README.md",      size:  8000, type: "blob", sha: "16" },
  { path: "next.config.js", size:  1000, type: "blob", sha: "17" },
  { path: ".env",           size:   500, type: "blob", sha: "19" },

  // src/app/api  → another sub-group
  { path: "src/app/api/auth/route.ts",   size:  5000, type: "blob", sha: "18" },
  { path: "src/app/api/user/route.ts",   size:  4200, type: "blob", sha: "35" },
  { path: "src/app/api/city/route.ts",   size:  3800, type: "blob", sha: "36" },

  // public
  { path: "public/favicon.ico",          size: 12000, type: "blob", sha: "20" },
  { path: "public/og-image.png",         size: 22000, type: "blob", sha: "37" },
];

const { buildings: DEMO_BUILDINGS, roads: DEMO_ROADS, districts: DEMO_DISTRICTS } =
  buildCityLayout(mockFiles);

// Compute tight bounding box so the ground plate only covers the actual city
const cityBounds = (() => {
  if (DEMO_BUILDINGS.length === 0) return { size: 40, cx: 0, cz: 0 };
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const b of DEMO_BUILDINGS) {
    minX = Math.min(minX, b.x - b.width / 2);
    maxX = Math.max(maxX, b.x + b.width / 2);
    minZ = Math.min(minZ, b.z - b.depth / 2);
    maxZ = Math.max(maxZ, b.z + b.depth / 2);
  }
  const pad = 4; // small padding around buildings
  return {
    size: Math.max(maxX - minX, maxZ - minZ) + pad * 2,
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
  };
})();

export default function DemoCityScene() {
  const { size: gridSize, cx, cz } = cityBounds;

  return (
    <Canvas
      camera={{ position: [gridSize * 1.4, gridSize * 1.55, gridSize * 1.4], fov: 38 }}
      shadows
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#06001a"]} />
      {/* Push fog far enough so the full zoomed-out city is visible */}
      <fog attach="fog" args={["#06001a", gridSize * 1.8, gridSize * 4.5]} />

      {/* Lighting */}
      <ambientLight intensity={0.12} color="#1a004d" />
      <directionalLight position={[20, 40, 20]} intensity={0.5} color="#6622cc" castShadow />
      <hemisphereLight args={["#110033", "#000011", 0.3]} />
      <pointLight position={[cx, 15, cz]} color="#00ffff" intensity={2} distance={gridSize * 1.2} />
      {/* Extra colored point-lights for pink / purple atmosphere */}
      <pointLight position={[cx + gridSize * 0.3, 10, cz - gridSize * 0.3]} color="#d946ef" intensity={1.2} distance={gridSize * 0.8} />
      <pointLight position={[cx - gridSize * 0.3, 10, cz + gridSize * 0.3]} color="#2563eb" intensity={1.2} distance={gridSize * 0.8} />

      {/* OrbitControls — target raised so city sits in lower half of frame */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={gridSize * 0.5}
        maxDistance={gridSize * 3.5}
        maxPolarAngle={Math.PI / 2.05}
        target={[cx, 28, cz]}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />

      {/* Compact ground plate — sized to the city, not the whole viewport */}
      <group position={[cx, 0, cz]}>
        <mesh position={[0, -1.05, 0]} receiveShadow>
          <boxGeometry args={[gridSize, 2, gridSize]} />
          <meshStandardMaterial color="#080414" roughness={0.9} metalness={0.1} />
        </mesh>
        {/* Glowing cyan trim */}
        <mesh position={[0, -2.0, 0]}>
          <boxGeometry args={[gridSize + 0.1, 0.05, gridSize + 0.1]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.5} toneMapped={false} />
        </mesh>
        {/* Pink trim on opposite edge for colour variety */}
        <mesh position={[0, -2.08, 0]}>
          <boxGeometry args={[gridSize + 0.2, 0.04, gridSize + 0.2]} />
          <meshBasicMaterial color="#d946ef" transparent opacity={0.3} toneMapped={false} />
        </mesh>
      </group>

      {/* Road grid — solid asphalt (no mirror reflector in the demo panel) */}
      <CityGrid
        gridSize={gridSize}
        roads={DEMO_ROADS}
        districts={DEMO_DISTRICTS}
        isHomepage={true}
        isDemo={true}
      />

      {/* Buildings */}
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
    const n = 800;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 400;
      pos[i * 3 + 1] = 10 + Math.random() * 150;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 400;
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
