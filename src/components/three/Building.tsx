"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import { BuildingData } from "@/lib/cityLayout";

interface BuildingProps {
  data: BuildingData;
  onClick: (data: BuildingData) => void;
}

export default function Building({ data, onClick }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = hovered
      ? 0.4 + Math.sin(state.clock.elapsedTime * 6) * 0.2
      : 0.08;
  });

  const halfH = data.height / 2;

  return (
    <group position={[data.x, 0, data.z]}>
      {/* Main body */}
      <mesh
        ref={meshRef}
        position={[0, halfH, 0]}
        onClick={() => onClick(data)}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[data.width, data.height, data.depth]} />
        <meshStandardMaterial
          color="#060610"
          emissive={data.emissiveColor}
          emissiveIntensity={0.08}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.92}
        />
        <Edges threshold={15} color={hovered ? "#ffffff" : data.emissiveColor} />
      </mesh>

      {/* === BUILDING VARIATIONS === */}

      {/* STEPPED: tiered setback on top half */}
      {data.buildingType === "stepped" && (
        <mesh position={[0, data.height * 0.85, 0]}>
          <boxGeometry args={[data.width * 0.6, data.height * 0.3, data.depth * 0.6]} />
          <meshStandardMaterial
            color="#060610"
            emissive={data.emissiveColor}
            emissiveIntensity={0.12}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.92}
          />
          <Edges threshold={15} color={data.emissiveColor} />
        </mesh>
      )}

      {/* ANTENNA: thin pole + glowing tip on top */}
      {data.buildingType === "antenna" && (
        <group position={[0, data.height, 0]}>
          {/* pole */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 3, 4]} />
            <meshBasicMaterial color={data.emissiveColor} />
          </mesh>
          {/* glowing tip */}
          <mesh position={[0, 3.2, 0]}>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshBasicMaterial color={data.emissiveColor} />
          </mesh>
        </group>
      )}

      {/* TOWER: pyramid cap on top */}
      {data.buildingType === "tower" && (
        <mesh position={[0, data.height + 0.6, 0]}>
          <coneGeometry args={[data.width * 0.4, 1.5, 4]} />
          <meshStandardMaterial
            color="#060610"
            emissive={data.emissiveColor}
            emissiveIntensity={0.2}
            roughness={0.1}
            metalness={1}
          />
          <Edges threshold={15} color={data.emissiveColor} />
        </mesh>
      )}

      {/* SPIRE: thin spike on top */}
      {data.buildingType === "spire" && (
        <mesh position={[0, data.height + 0.5, 0]}>
          <coneGeometry args={[0.15, 1.2, 4]} />
          <meshBasicMaterial color={data.emissiveColor} />
        </mesh>
      )}

      {/* Horizontal floor lines on taller buildings — makes them look like the reference */}
      {data.height > 5 && (() => {
        const lines = [];
        const floorH = 1.8;
        const floors = Math.floor(data.height / floorH);
        for (let f = 1; f < floors; f++) {
          lines.push(
            <mesh key={f} position={[0, f * floorH, 0]}>
              <boxGeometry args={[data.width + 0.04, 0.02, data.depth + 0.04]} />
              <meshBasicMaterial color={data.emissiveColor} transparent opacity={0.35} />
            </mesh>
          );
        }
        return lines;
      })()}
    </group>
  );
}
