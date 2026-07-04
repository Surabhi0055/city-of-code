"use client";

import { OrbitControls } from "@react-three/drei";
import CityGrid from "./CityGrid";

export default function CyberCity() {
  return (
    <>
      <fog attach="fog" args={["#0a0a0f", 60, 300]} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2.2}
        target={[30, 0, 30]}
      />
      <CityGrid />
    </>
  );
}
