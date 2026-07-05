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
  const count = 800;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * gridSize * 3;
      pos[i * 3 + 1] = 25 + Math.random() * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * gridSize * 3;
    }
    return pos;
  }, [gridSize]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#8888ff" size={0.2} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

interface CyberCityProps {
  gridSize: number;
  buildings: BuildingData[];
  roads: RoadData[];
  districts?: any[];
}

export default function CyberCity({ gridSize, buildings, roads, districts = [] }: CyberCityProps) {
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
      <fog attach="fog" args={["#1a052a", gridSize * 0.4, gridSize * 2.5]} />

      {/* Dark background makes the lighter fog visible */}
      <color attach="background" args={["#050810"]} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={gridSize * 3}
        maxPolarAngle={Math.PI / 2.1}
        target={center}
      />

      <CityGrid gridSize={gridSize} roads={roads} districts={districts} />
      <LampPosts roads={roads} />
      {districts && districts.length > 0 && <CityLights districts={districts} />}
      <CityClouds gridSize={gridSize} />
      <Starfield gridSize={gridSize} />
    </>
  );
}
