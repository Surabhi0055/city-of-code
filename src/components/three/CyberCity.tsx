"use client";

import { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import CityGrid from "./CityGrid";
import LampPosts from "./LampPosts";
import CityLights from "./CityLights";
import CityClouds from "./CityClouds";
import { BuildingData, RoadData, DistrictData } from "@/lib/cityLayout";

function Starfield() {
  const layer1Count = 4000;
  const layer2Count = 1000;

  const positions1 = useMemo(() => {
    const pos = new Float32Array(layer1Count * 3);
    for (let i = 0; i < layer1Count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 600; // x: wider spread
      pos[i * 3 + 1] = 2 + Math.random() * 250;     // y: from ground up to sky
      pos[i * 3 + 2] = (Math.random() - 0.5) * 600; // z
    }
    return pos;
  }, []);

  const positions2 = useMemo(() => {
    const pos = new Float32Array(layer2Count * 3);
    for (let i = 0; i < layer2Count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 400; // x
      pos[i * 3 + 1] = 1 + Math.random() * 150;     // y: from near ground
      pos[i * 3 + 2] = (Math.random() - 0.5) * 400; // z
    }
    return pos;
  }, []);

  return (
    <group>
      {/* Background stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions1, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#aaaaff" size={0.15} sizeAttenuation={true} transparent opacity={0.6} />
      </points>
      {/* Foreground stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions2, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.35} sizeAttenuation={true} transparent opacity={0.9} />
      </points>
    </group>
  );
}

function SynthwaveSun() {
  const sunVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
  `;

  const sunFragmentShader = `
    varying vec2 vUv;
    void main() {
      // The sun is placed at y=8, radius=30. Ground is at y=0.
      // So the bottom 22 units of the sun are hidden underground!
      // This means vUv.y from 0.0 to 0.366 is hidden.
      // We normalize our Y coordinate to the visible portion (0.366 to 1.0)
      float visY = clamp((vUv.y - 0.366) / 0.634, 0.0, 1.0);

      // Colors matching the reference image perfectly
      vec3 colorTop = vec3(1.0, 0.8, 0.0); // bright yellow
      vec3 colorMid = vec3(1.0, 0.3, 0.1); // orange
      vec3 colorBot = vec3(0.9, 0.0, 0.5); // neon pink

      vec3 color = mix(colorBot, colorMid, smoothstep(0.0, 0.5, visY));
      color = mix(color, colorTop, smoothstep(0.5, 1.0, visY));

      float alpha = 1.0;

      if (visY < 0.5) {
         // Uniform, perfectly even stripes
         // visY * 14.0 gives 7 stripes in the bottom half.
         // fract() < 0.4 means 40% of each stripe is a transparent gap, 60% is solid sun.
         if (fract(visY * 14.0) < 0.4) {
            alpha = 0.0;
         }
      }
      
      if (vUv.y < 0.366) {
         alpha = 0.0; // Hide the underground part just in case
      }
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const glowFragmentShader = `
    varying vec2 vUv;
    void main() {
      float d = distance(vUv, vec2(0.5));
      // Soft radial blur fading out from center
      float alpha = smoothstep(0.5, 0.2, d) * 0.4;
      gl_FragColor = vec4(1.0, 0.0, 0.4, alpha);
    }
  `;

  const reflectionFragmentShader = `
    varying vec2 vUv;
    void main() {
      // Fade horizontally from center
      float xFade = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
      
      // Fade vertically. vUv.y=1 is the far horizon, vUv.y=0 is near the camera.
      float yFade = pow(vUv.y, 1.5);
      
      float alpha = xFade * yFade;
      gl_FragColor = vec4(1.0, 0.0, 0.8, alpha); // Hot pink reflection
    }
  `;

  return (
    <group position={[0, 8, -120]}>
      {/* Sun soft glow corona (Blurred on sides) */}
      <mesh position={[0, 0, -2]}>
        <circleGeometry args={[45, 64]} />
        <shaderMaterial
          vertexShader={sunVertexShader}
          fragmentShader={glowFragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Sun main body (Circle for flat, straight stripes) */}
      <mesh position={[0, 0, -1]}>
        <circleGeometry args={[30, 64]} />
        <shaderMaterial
          vertexShader={sunVertexShader}
          fragmentShader={sunFragmentShader}
          transparent={true}
          depthWrite={false}
        />
      </mesh>

      {/* Ground reflection sitting ON TOP of the grid (y=0.05) */}
      <mesh position={[0, -7.95, 60]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 150]} />
        <shaderMaterial
          vertexShader={sunVertexShader}
          fragmentShader={reflectionFragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
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
        target={isHomepage ? [0, 8, 0] : center}
        autoRotate={false}
        autoRotateSpeed={0.6}
      />

      <CityGrid gridSize={gridSize} roads={roads} districts={districts} />
      <LampPosts roads={roads} />
      {districts && districts.length > 0 && <CityLights districts={districts} />}
      <CityClouds gridSize={gridSize} />
      <Starfield />
      <SynthwaveSun />
    </>
  );
}
