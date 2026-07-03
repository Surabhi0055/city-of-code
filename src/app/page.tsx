"use client";

import { Canvas } from "@react-three/fiber";
import CyberCity from "@/components/three/CyberCity";

export default function Home() {
  return (
    <main style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [20, 15, 20], fov: 60 }}
        gl={{ antialias: true }}
      >
        <CyberCity />
      </Canvas>
    </main>
  );
}
