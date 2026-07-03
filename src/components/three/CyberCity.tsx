"use client";

import { OrbitControls } from "@react-three/drei";
import CityGrid from "./CityGrid";

export default function CyberCity() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} color="#111133" />
      <pointLight position={[0, 20, 0]} color="#00ffff" intensity={2} />
      <fog attach="fog" args={["#0a0a0f", 30, 150]} />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.2}
      />

      {/* Scene */}
      <CityGrid />
    </>
  );
}
