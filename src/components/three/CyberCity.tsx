"use client";

import { OrbitControls } from "@react-three/drei";
import CityGrid from "./CityGrid";

export default function CyberCity() {
  return (
    <>
      <fog attach="fog" args={["#050510", 40, 160]} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2.2}
        target={[30, 0, 15]}
      />
      <CityGrid />
    </>
  );
}
