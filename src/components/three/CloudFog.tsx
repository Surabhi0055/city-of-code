// src/components/three/CloudFog.tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function CloudFog({ gridSize = 600 }: { gridSize?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 30;

  // Store base positions and speeds
  const data = useMemo(() => {
    const positions = [];
    // Scale number of clouds loosely based on gridSize
    const cloudCount = Math.floor(gridSize / 15);
    for (let i = 0; i < cloudCount; i++) {
      positions.push({
        x: (Math.random() - 0.5) * gridSize,
        y: 15 + Math.random() * 20,
        z: (Math.random() - 0.5) * gridSize,
        scale: 10 + Math.random() * 20,
        speed: 0.02 + Math.random() * 0.05,
      });
    }
    return positions;
  }, [gridSize]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    data.forEach((cloud, i) => {
      cloud.x += cloud.speed;
      if (cloud.x > gridSize / 2) cloud.x = -gridSize / 2;

      dummy.position.set(cloud.x, cloud.y, cloud.z);
      dummy.scale.setScalar(cloud.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      {/* Use BasicMaterial so it is unlit and purely white/misty */}
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.05}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
