"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export default function CityClouds({ gridSize }: { gridSize: number }) {
  const count = 150; // High particle count for dense fog
  
  // Generate a procedural soft cloud texture
  const cloudTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    
    // Base soft radial gradient
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Use InstancedMesh for extreme performance
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * gridSize * 1.5,
        y: 25 + Math.random() * 20, // Float high up near the top of the tallest buildings
        z: (Math.random() - 0.5) * gridSize * 1.5,
        scale: 15 + Math.random() * 30, // Massive soft sprites
        speed: 0.05 + Math.random() * 0.1, // Very slow drifting
        offset: Math.random() * 100,
      });
    }
    return arr;
  }, [gridSize, count]);

  useFrame(({ clock, camera }) => {
    if (!meshRef.current) return;
    const time = clock.elapsedTime;
    
    particles.forEach((p, i) => {
      // Continuous movement across the grid
      const speedMultiplier = 20;
      const driftZ = p.z + time * p.speed * speedMultiplier;
      const driftX = p.x + Math.sin(time * p.speed * 2 + p.offset) * 15;
      
      // Wrap around grid boundaries
      const wrapZ = ((driftZ + gridSize * 1.5) % (gridSize * 3)) - gridSize * 1.5;
      
      dummy.position.set(driftX, p.y, wrapZ);
      
      // Billboarding: always face the camera
      dummy.lookAt(camera.position);
      
      dummy.scale.set(p.scale, p.scale, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={cloudTex} 
        transparent={true} 
        depthWrite={false} 
        blending={THREE.NormalBlending} 
        opacity={0.8}
        color="#ffffff"
      />
    </instancedMesh>
  );
}
