// src/components/three/CityBuildings.tsx
"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BuildingData } from "@/lib/cityLayout";
import Building from "./Building";

interface CityBuildingsProps {
  buildings: BuildingData[];
  onBuildingClick: (data: BuildingData) => void;
}

// A global window system that draws all windows in a single draw call
function GlobalWindows({ buildings }: { buildings: BuildingData[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // We only want a few scattered lit windows to match the TRON aesthetic
  const windowData = useMemo(() => {
    const wins: { pos: THREE.Vector3; color: THREE.Color }[] = [];
    const colorCache = new Map<string, THREE.Color>();

    buildings.forEach((b) => {
      // Skip spires and tiny buildings
      if (b.height < 4 || b.buildingType === "spire") return;

      if (!colorCache.has(b.emissiveColor)) {
        colorCache.set(b.emissiveColor, new THREE.Color(b.emissiveColor));
      }
      const col = colorCache.get(b.emissiveColor)!;

      const floors = Math.floor(b.height / 1.5);
      const wCols = Math.max(1, Math.floor(b.width / 1.0));
      const dCols = Math.max(1, Math.floor(b.depth / 1.0));

      // Global coordinates for the building
      const bx = b.x;
      const bz = b.z;

      for (let f = 1; f < floors; f++) {
        // y is global height
        const y = f * 1.5 + 0.5;

        // Front and back
        for (let c = 0; c < wCols; c++) {
          if (Math.random() > 0.15) continue; // Only 15% of windows lit
          const wx = bx - b.width / 2 + (c + 0.5) * (b.width / wCols);
          wins.push({ pos: new THREE.Vector3(wx, y, bz + b.depth / 2 + 0.02), color: col });
          if (Math.random() > 0.8) {
             wins.push({ pos: new THREE.Vector3(wx, y, bz - b.depth / 2 - 0.02), color: col });
          }
        }

        // Left and right
        for (let c = 0; c < dCols; c++) {
          if (Math.random() > 0.15) continue;
          const wz = bz - b.depth / 2 + (c + 0.5) * (b.depth / dCols);
          wins.push({ pos: new THREE.Vector3(bx + b.width / 2 + 0.02, y, wz), color: col });
          if (Math.random() > 0.8) {
            wins.push({ pos: new THREE.Vector3(bx - b.width / 2 - 0.02, y, wz), color: col });
          }
        }
      }
    });
    return wins;
  }, [buildings]);

  // Set the matrices and colors for the InstancedMesh
  useMemo(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    
    // We must reset the count in case buildings changed
    meshRef.current.count = windowData.length;

    windowData.forEach((win, i) => {
      dummy.position.copy(win.pos);
      // Windows on X axis need rotation, windows on Z axis don't.
      // But we can just make them tiny boxes so we don't need to rotate planes!
      // This is a great trick for instancing windows: use a tiny box.
      dummy.scale.setScalar(1); 
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, win.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [windowData]);

  if (windowData.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, windowData.length]}>
      {/* A tiny box geometry handles all rotations for us */}
      <boxGeometry args={[0.2, 0.35, 0.2]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={1.5}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

export default function CityBuildings({ buildings, onBuildingClick }: CityBuildingsProps) {
  return (
    <>
      <GlobalWindows buildings={buildings} />
      {buildings.map((building) => (
        <Building
          key={building.id}
          data={building}
          onClick={onBuildingClick}
        />
      ))}
    </>
  );
}
