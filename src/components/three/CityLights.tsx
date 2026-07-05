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

  // Generate random positions for the lights
  const lights = useMemo(() => {
    const arr = [];
    const colors = ["#00ffff", "#ff00ff", "#ffcc00", "#00ff66"]; // Cyan, Magenta, Yellow, Green
    
    for (const d of districts) {
      // Create a few glowing orbs scattered around each district
      const count = 4 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const x = d.x + (Math.random() - 0.5) * d.w * 0.9;
        const z = d.z + (Math.random() - 0.5) * d.d * 0.9;
        const y = 0.5 + Math.random() * 1.5; // Float slightly above the ground
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const scale = 2.0 + Math.random() * 2.5; // Large blurred size
        
        arr.push({ x, y, z, color, scale, speed: 0.5 + Math.random(), offset: Math.random() * Math.PI * 2 });
      }
    }
    return arr;
  }, [districts]);

  return (
    <group>
      {lights.map((l, i) => (
        <AnimatedLight key={i} data={l} tex={glowTexture} />
      ))}
    </group>
  );
}

function AnimatedLight({ data, tex }: { data: any, tex: THREE.Texture }) {
  const materialRef = useRef<THREE.SpriteMaterial>(null);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      // Gently pulse the opacity to make the lights feel alive
      materialRef.current.opacity = 0.6 + 0.3 * Math.sin(clock.elapsedTime * data.speed + data.offset);
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
