"use client";

import { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import CityGrid from "./CityGrid";
import LampPosts from "./LampPosts";
import CityLights from "./CityLights";
import CityClouds from "./CityClouds";
import { BuildingData, RoadData, DistrictData } from "@/lib/cityLayout";

function Starfield({ gridSize = 100 }: { gridSize?: number }) {
  const count = 3000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * gridSize * 6; // Spread wider
      pos[i * 3 + 1] = 60 + Math.random() * 200; // Far above the clouds
      pos[i * 3 + 2] = (Math.random() - 0.5) * gridSize * 6;
    }
    return pos;
  }, [gridSize]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* Set sizeAttenuation to false so they render exactly 2 pixels wide, very crisp! */}
      <pointsMaterial color="#ffffff" size={2} transparent opacity={0.8} sizeAttenuation={false} />
    </points>
  );
}

interface CyberCityProps {
  gridSize: number;
  buildings: BuildingData[];
  roads: RoadData[];
  districts?: DistrictData[];
  isHomepage?: boolean;
}

export default function CyberCity({ gridSize, buildings, roads, districts = [], isHomepage = false }: CyberCityProps) {
  // Center orbit on the middle of buildings
  const center = useMemo(() => {
    if (buildings.length === 0) return [0, 0, 0] as [number, number, number];
    let sx = 0, sz = 0;
    buildings.forEach(b => { sx += b.x; sz += b.z; });
    return [sx / buildings.length, 0, sz / buildings.length] as [number, number, number];
  }, [buildings]);

  return (
    <>
      {/* Colorful misty haze reflecting the ground grid */}
      <fog attach="fog" args={["#040810", gridSize * 0.4, gridSize * 2.5]} />

      {/* Dark background makes the lighter fog visible */}
      <color attach="background" args={["#040810"]} />

      <OrbitControls
        enablePan={!isHomepage}
        enableZoom={!isHomepage}
        enableRotate={!isHomepage}
        minDistance={3}
        maxDistance={gridSize * 3}
        maxPolarAngle={Math.PI / 2.1}
        target={center}
        autoRotate={isHomepage}
        autoRotateSpeed={0.6}
      />

      <CityGrid gridSize={gridSize} roads={roads} districts={districts} />
      <LampPosts roads={roads} />
      {districts && districts.length > 0 && <CityLights districts={districts} />}
      <CityClouds gridSize={gridSize} />
      <Starfield gridSize={gridSize} />
    </>
  );
}
