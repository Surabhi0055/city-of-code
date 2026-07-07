"use client";

import { useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CityGrid from "./CityGrid";
import LampPosts from "./LampPosts";
import CityLights from "./CityLights";
import CityClouds from "./CityClouds";
import RetroMountains from "./RetroMountains";
import { BuildingData, RoadData, DistrictData } from "@/lib/cityLayout";

function SunsetGlow() {
  const glowVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
  `;
  
  const glowFragmentShader = `
    varying vec2 vUv;
    void main() {
      // vUv.x goes from 0 to 1, vUv.y goes from 0 to 1
      // We want the glow centered horizontally (x=0.5) and starting from the bottom (y=0.0)
      
      // Calculate distance from bottom-center
      vec2 center = vec2(0.5, 0.0);
      
      // We scale X so the glow is wider than it is tall (elliptical)
      vec2 scaledUv = vec2(vUv.x, vUv.y * 1.5);
      vec2 scaledCenter = vec2(0.5, 0.0);
      
      float d = distance(scaledUv, scaledCenter);
      
      // Smooth fade out
      float alpha = smoothstep(0.8, 0.0, d);
      
      // Sunset colors
      vec3 colorBottom = vec3(1.0, 0.0, 0.5); // Neon pink
      vec3 colorTop = vec3(0.5, 0.0, 0.8);    // Purple edge
      
      vec3 color = mix(colorTop, colorBottom, alpha);
      
      gl_FragColor = vec4(color, alpha * 0.7); // 0.7 max opacity
    }
  `;

  return (
    // Placed behind the sun (z=-120) and mountains (z=-90)
    <mesh position={[0, 40, -130]}>
      {/* Width 300, height 150. Sitting on the horizon. */}
      <planeGeometry args={[400, 200]} />
      <shaderMaterial
        vertexShader={glowVertexShader}
        fragmentShader={glowFragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

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
    <group position={[0, 0, -20]}>
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

function SynthwaveSun({ loading = false }: { loading?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const uniforms = useMemo(() => ({
    uZoom: { value: 0.0 }
  }), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (loading) {
        // Zoom in massively to cover the screen
        groupRef.current.position.lerp(new THREE.Vector3(0, 8, -30), 1.5 * delta);
        groupRef.current.scale.lerp(new THREE.Vector3(15, 15, 15), 1.5 * delta);
        uniforms.uZoom.value = THREE.MathUtils.lerp(uniforms.uZoom.value, 1.0, 2.0 * delta);
      } else {
        // Normal far horizon position
        groupRef.current.position.lerp(new THREE.Vector3(0, 8, -120), 3.0 * delta);
        groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 3.0 * delta);
        uniforms.uZoom.value = THREE.MathUtils.lerp(uniforms.uZoom.value, 0.0, 3.0 * delta);
      }
    }
  });

  const sunVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
  `;

  const sunFragmentShader = `
    uniform float uZoom;
    varying vec2 vUv;
    void main() {
      // The sun is placed at y=8, radius=30. Ground is at y=0.
      // Normally the bottom 22 units of the sun are hidden underground (vUv.y < 0.366)
      // When zooming (uZoom=1), we transition the cutoff to 0.0 so the whole circle becomes visible!
      float cutoff = mix(0.366, 0.0, uZoom);
      float range = 1.0 - cutoff;
      float visY = clamp((vUv.y - cutoff) / range, 0.0, 1.0);

      // Colors matching the reference image perfectly
      vec3 colorTop = vec3(1.0, 0.8, 0.0); // bright yellow
      vec3 colorMid = vec3(1.0, 0.3, 0.1); // orange
      vec3 colorBot = vec3(0.9, 0.0, 0.5); // neon pink

      vec3 color = mix(colorBot, colorMid, smoothstep(0.0, 0.5, visY));
      color = mix(color, colorTop, smoothstep(0.5, 1.0, visY));

      float alpha = 1.0;

      if (visY < 0.6) {
         // Uniform, perfectly even stripes
         // visY * 26.0 gives many thin stripes in the lower 60%
         // fract() < 0.4 means 40% of each stripe is a transparent gap
         if (fract(visY * 26.0) < 0.4) {
            alpha = 0.0;
         }
      }
      
      if (vUv.y < cutoff) {
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
    uniform float uZoom;
    varying vec2 vUv;
    void main() {
      // Fade horizontally from center
      float xFade = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
      
      // Fade vertically. vUv.y=1 is the far horizon, vUv.y=0 is near the camera.
      float yFade = pow(vUv.y, 1.5);
      
      // Fade out reflection entirely during the zoom transition
      float alpha = xFade * yFade * (1.0 - uZoom);
      gl_FragColor = vec4(1.0, 0.0, 0.8, alpha); // Hot pink reflection
    }
  `;

  return (
    <group ref={groupRef} position={[0, 8, -120]}>
      {/* Sun soft glow corona (Blurred on sides) */}
      <mesh position={[0, 0, -2]}>
        <circleGeometry args={[45, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={sunVertexShader}
          fragmentShader={glowFragmentShader}
          transparent={true}
          depthWrite={false}
          depthTest={!loading}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Sun main body (Circle for flat, straight stripes) */}
      <mesh position={[0, 0, -1]}>
        <circleGeometry args={[30, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={sunVertexShader}
          fragmentShader={sunFragmentShader}
          transparent={true}
          depthWrite={false}
          depthTest={!loading}
        />
      </mesh>

      {/* Ground reflection sitting ON TOP of the grid (y=0.05) */}
      <mesh position={[0, -7.95, 60]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 150]} />
        <shaderMaterial
          uniforms={uniforms}
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
  gridSize?: number;
  buildings?: BuildingData[];
  roads?: RoadData[];
  districts?: DistrictData[];
  isHomepage?: boolean;
  loading?: boolean;
}

export default function CyberCity({ gridSize = 100, buildings = [], roads = [], districts = [], isHomepage = false, loading = false }: CyberCityProps) {
  // Center orbit on the middle of buildings
  const center = useMemo(() => {
    if (buildings.length === 0) return [0, 0, 0] as [number, number, number];
    let sx = 0, sz = 0;
    buildings.forEach(b => { sx += b.x; sz += b.z; });
    return [sx / buildings.length, 0, sz / buildings.length] as [number, number, number];
  }, [buildings]);

  return (
    <>
      {/* Restored the dark background so everything below the grid is black space */}
      <color attach="background" args={["#040810"]} />
      
      {/* Localized sunset glow strictly behind the mountains/sun */}
      <SunsetGlow />
      
      {/* Fog matched to the dark background so the ground fades into darkness! */}
      <fog attach="fog" args={["#040810", gridSize * 0.5, gridSize * 1.5]} />

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
      
      {/* Layering: Sun sits behind the mountains! */}
      <SynthwaveSun loading={loading} />
      <RetroMountains />
    </>
  );
}
