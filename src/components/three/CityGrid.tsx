"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoadData, DistrictData } from "@/lib/cityLayout";

interface CityGridProps {
  gridSize: number;
  roads?: RoadData[];
  districts?: DistrictData[];
}

const GlobalGradientShader = {
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPos;
    void main() {
      vec3 colorCyan = vec3(0.0, 1.0, 1.0);
      vec3 colorMagenta = vec3(1.0, 0.0, 1.0);
      float t = clamp((vWorldPos.x + vWorldPos.z + 100.0) / 200.0, 0.0, 1.0);
      vec3 baseColor = mix(colorCyan, colorMagenta, t);

      float distToCam = distance(cameraPosition, vWorldPos);
      float camFade = smoothstep(90.0, 30.0, distToCam);
      
      float distToCenter = length(vWorldPos.xz);
      float centerFade = smoothstep(80.0, 40.0, distToCenter);

      gl_FragColor = vec4(baseColor * 1.2, camFade * centerFade);
    }
  `
};

const CircuitGridShader = {
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPos;
    
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      // Major grid - larger spacing
      float majorSpacing = 5.0;
      float majorThickness = 0.04;
      float mx = step(abs(fract(vWorldPos.x / majorSpacing + 0.5) - 0.5), majorThickness / (2.0 * majorSpacing));
      float mz = step(abs(fract(vWorldPos.z / majorSpacing + 0.5) - 0.5), majorThickness / (2.0 * majorSpacing));
      float majorGrid = max(mx, mz);

      // Minor traces - less dense, larger rectangles
      float minorSpacing = 1.0;
      float minorThickness = 0.02;
      
      // X-directed minor lines (placed along Z)
      float zMinorId = floor(vWorldPos.z / minorSpacing);
      float xChunk = floor(vWorldPos.x / 4.0); // breaks every 4 units
      float drawXMinor = step(0.6, hash(vec2(zMinorId, xChunk))); 
      float minorX = drawXMinor * step(abs(fract(vWorldPos.z / minorSpacing + 0.5) - 0.5), minorThickness / (2.0 * minorSpacing));

      // Z-directed minor lines (placed along X)
      float xMinorId = floor(vWorldPos.x / minorSpacing);
      float zChunk = floor(vWorldPos.z / 4.0);
      float drawZMinor = step(0.6, hash(vec2(xMinorId + 100.0, zChunk)));
      float minorZ = drawZMinor * step(abs(fract(vWorldPos.x / minorSpacing + 0.5) - 0.5), minorThickness / (2.0 * minorSpacing));

      float minorGrid = max(minorX, minorZ);

      float distToCam = distance(cameraPosition, vWorldPos);
      float camFade = smoothstep(90.0, 30.0, distToCam);
      
      float distToCenter = length(vWorldPos.xz);
      float centerFade = smoothstep(80.0, 40.0, distToCenter);

      // Combine grids - make the big squares subtle (0.4) and the inside small lines brighter (1.0)
      float finalAlpha = max(majorGrid * 0.4, minorGrid * 1.0) * camFade * centerFade;
      if (finalAlpha < 0.01) discard;

      // Global Cyan-to-Magenta Gradient across the city
      vec3 colorCyan = vec3(0.0, 1.0, 1.0);
      vec3 colorMagenta = vec3(1.0, 0.0, 1.0);
      float t = clamp((vWorldPos.x + vWorldPos.z + 100.0) / 200.0, 0.0, 1.0);
      vec3 baseColor = mix(colorCyan, colorMagenta, t);

      gl_FragColor = vec4(baseColor * 1.2, finalAlpha);
    }
  `
};

export default function CityGrid({ gridSize, roads = [], districts = [] }: CityGridProps) {
  const planeGeom = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  return (
    <>
      {/* Ground plane background */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} frustumCulled={true}>
        <planeGeometry args={[gridSize * 1.5, gridSize * 1.5]} />
        <meshStandardMaterial color="#020208" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* The massive global circuit grid covering all the land */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} frustumCulled={true}>
        <planeGeometry args={[gridSize * 1.5, gridSize * 1.5]} />
        <shaderMaterial 
          vertexShader={CircuitGridShader.vertexShader}
          fragmentShader={CircuitGridShader.fragmentShader}
          transparent={true}
          depthWrite={false}
        />
      </mesh>

      {roads.map((road, i) => {
        const isHighway = road.type === "highway";
        const isMain = road.type === "main";
        const isAlley = road.type === "alley";
        
        const yOffset = isHighway ? 0.05 : isMain ? 0.03 : 0.01;
        const isHoriz = road.width > road.length;
        
        const dashes = [];
        if (isHighway || isMain) {
          const dashLength = 2;
          const dashGap = 2;
          const totalDist = isHoriz ? road.width : road.length;
          const numDashes = Math.floor(totalDist / (dashLength + dashGap));
          const start = -totalDist / 2;
          for (let j = 0; j < numDashes; j++) {
            const centerPos = start + j * (dashLength + dashGap) + dashLength / 2;
            dashes.push(centerPos);
          }
        }

        return (
          <group key={`${road.id}-${i}`} position={[road.x, yOffset, road.z]}>
            {/* Dark asphalt road body */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={planeGeom} scale={[road.width, road.length, 1]} frustumCulled={true}>
              <meshStandardMaterial color={road.color} emissive="#0a0a1a" roughness={0.3} metalness={0.5} />
            </mesh>
            
            {/* Gradient Road Edges outlining the city blocks (REMOVED as per user request) */}
            
            {/* Dashed center lines */}
            {dashes.map((d, j) => (
              <mesh 
                key={j} 
                position={[isHoriz ? d : 0, 0.01, isHoriz ? 0 : d]} 
                rotation={[-Math.PI / 2, 0, 0]}
                geometry={planeGeom} 
                scale={[isHoriz ? 2 : 0.15, isHoriz ? 0.15 : 2, 1]}
                frustumCulled={true}
              >
                <meshBasicMaterial color="#ffffff" transparent opacity={isHighway ? 0.6 : 0.5} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
}
