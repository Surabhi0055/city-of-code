"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BuildingData } from "@/lib/cityLayout";

interface BuildingProps {
  data: BuildingData;
  onClick: (data: BuildingData) => void;
}

// Randomly flicker some windows
function WindowLights({ height, color }: { height: number; color: string }) {
  // PERFORMANCE FIX: Don't render individual windows for small files to save thousands of draw calls
  if (height < 3) return null;

  const windows = [];
  const rows = Math.floor(height / 1.5); // PERFORMANCE FIX: increased spacing to reduce window count
  const cols = 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() > 0.35; // 65% of windows are lit
      if (!lit) continue;

      // PERFORMANCE FIX: Only render front-face windows to cut draw calls in half
      windows.push(
        <mesh
          key={`f-${r}-${c}`}
          position={[
            c === 0 ? -0.45 : 0.45,
            r * 1.5 + 0.6 - height / 2,
            1.01
          ]}
        >
          <planeGeometry args={[0.25, 0.35]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={Math.random() * 1.5 + 0.5}
          />
        </mesh>
      );
    }
  }
  return <>{windows}</>;
}

export default function Building({ data, onClick }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = hovered
      ? 0.6 + Math.sin(state.clock.elapsedTime * 5) * 0.4
      : 0.35;
  });

  return (
    <group position={[data.x, data.height / 2, data.z]}>
      {/* Main building body */}
      <mesh
        ref={meshRef}
        onClick={() => onClick(data)}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[2, data.height, 2]} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={0.35}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* PERFORMANCE FIX: Rooftop pointLight removed. 500 pointLights crashes standard WebGL. */}

      {/* Window lights */}
      <WindowLights height={data.height} color={data.color} />
    </group>
  );
}
