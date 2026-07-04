"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BuildingData } from "@/lib/cityLayout";

interface BuildingProps {
  data: BuildingData;
  onClick: (data: BuildingData) => void;
}

export default function Building({ data, onClick }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Pulse the emissive intensity on hover
  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;

    if (hovered) {
      // Sine wave between 0.5 and 1.0 — creates a pulsing glow
      material.emissiveIntensity =
        0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.5;
    } else {
      material.emissiveIntensity = 0.15;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[data.x, data.height / 2, data.z]}
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
        emissiveIntensity={0.15}
        roughness={0.3}
        metalness={0.8}
      />
    </mesh>
  );
}
