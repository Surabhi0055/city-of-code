"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { DistrictData } from "@/lib/cityLayout";

interface CityLightsProps {
  districts: DistrictData[];
}

export default function CityLights({ districts }: CityLightsProps) {
  // Create a blurred circle texture for the glowing orbs
  const glowTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // Generate random positions for the lights and smoke
  const lights = useMemo(() => {
    const arr = [];
    const colors = ["#00ffff", "#ff00ff", "#ffcc00", "#00ff66"]; // Cyan, Magenta, Yellow, Green
    
    for (const d of districts) {
      // 1. Ground Lights (scattered on empty space and ground)
      const count = 6 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const x = d.x + (Math.random() - 0.5) * d.w * 1.2; // Spread wider across the district
        const z = d.z + (Math.random() - 0.5) * d.d * 1.2;
        const y = 0.5 + Math.random() * 3.0; // Float near the ground and lower building levels
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const scale = 3.0 + Math.random() * 3.0; // Medium blurred size
        
        arr.push({ x, y, z, color, scale, speed: 0.5 + Math.random(), offset: Math.random() * Math.PI * 2, isSmoke: false });
      }

      // 2. Neon Smoke / High Altitude Lights (massive, soft, colorful fogs near building tops)
      const skyCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < skyCount; i++) {
        const x = d.x + (Math.random() - 0.5) * d.w * 1.5;
        const z = d.z + (Math.random() - 0.5) * d.d * 1.5;
        const y = 20 + Math.random() * 25; // Float very high up near building tops
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const scale = 25.0 + Math.random() * 25.0; // Massive scale to look like blurred smoke/fog
        
        arr.push({ x, y, z, color, scale, speed: 0.1 + Math.random() * 0.2, offset: Math.random() * Math.PI * 2, isSmoke: true });
      }
    }
    return arr;
  }, [districts]);

  return (
    <group>
      {lights.map((l, i) => (
        <AnimatedLight key={i} data={l} tex={glowTexture} />
      ))}
      <StreetParticles />
    </group>
  );
}

function StreetParticles() {
  const count = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const arr = [];
    // Colors matching district neons (cyan, magenta, yellow)
    const colors = [new THREE.Color("#00ffff"), new THREE.Color("#ff00ff"), new THREE.Color("#ffcc00")];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 150,
        y: 1 + Math.random() * 3, // y = 1 to 4
        z: (Math.random() - 0.5) * 150,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.5 + Math.random() * 1.5,
        offset: Math.random() * Math.PI * 2
      });
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.elapsedTime;
    particles.forEach((p, i) => {
      // Slow sine-wave bobbing
      dummy.position.set(p.x, p.y + Math.sin(time * p.speed + p.offset) * 0.4, p.z);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, p.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function AnimatedLight({ data, tex }: { data: any, tex: THREE.Texture }) {
  const materialRef = useRef<THREE.SpriteMaterial>(null);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      // Gently pulse the opacity to make the lights feel alive
      // Drastically reduced opacity to prevent blowing out the screen with additive blending
      const baseOpacity = data.isSmoke ? 0.08 : 0.25; 
      const variance = data.isSmoke ? 0.04 : 0.15;
      materialRef.current.opacity = baseOpacity + variance * Math.sin(clock.elapsedTime * data.speed + data.offset);
    }
  });

  return (
    <sprite position={[data.x, data.y, data.z]} scale={[data.scale, data.scale, 1]}>
      <spriteMaterial 
        ref={materialRef} 
        map={tex} 
        color={data.color} 
        transparent={true} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </sprite>
  );
}
