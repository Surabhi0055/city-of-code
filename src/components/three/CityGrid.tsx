"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
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

      // Global Cyan grid
      vec3 baseColor = vec3(0.0, 0.8, 1.0); // Cyan

      gl_FragColor = vec4(baseColor * 1.5, finalAlpha);
    }
  `
};

const roadStencilMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
roadStencilMat.stencilWrite = true;
roadStencilMat.stencilRef = 1;
roadStencilMat.stencilFunc = THREE.AlwaysStencilFunc;
roadStencilMat.stencilZPass = THREE.ReplaceStencilOp;

export default function CityGrid({ gridSize, roads = [], districts = [] }: CityGridProps) {
  const planeGeom = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  return (
    <>
      {/* Ground plane — wet road reflective surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} frustumCulled={true}>
        <planeGeometry args={[gridSize * 1.5, gridSize * 1.5]} />
        <MeshReflectorMaterial
          blur={[100, 100]}
          resolution={1024}
          mixBlur={0.2}
          mixStrength={8.0}
          roughness={0.1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#020208"
          metalness={0.9}
          mirror={1}
        />
      </mesh>

      {/* The global circuit grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} frustumCulled={true}>
        <planeGeometry args={[gridSize * 1.5, gridSize * 1.5]} />
        <shaderMaterial 
          vertexShader={CircuitGridShader.vertexShader}
          fragmentShader={CircuitGridShader.fragmentShader}
          transparent={true}
          depthWrite={false}
          stencilWrite={true}
          stencilRef={0}
          stencilFunc={THREE.EqualStencilFunc}
        />
      </mesh>

      {/* District Ground Plates — subtle color tint */}
      {districts.map((d, i) => (
        <mesh key={`district-${i}`} position={[d.x, -0.02, d.z]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={true}>
          <planeGeometry args={[d.w, d.d]} />
          <meshBasicMaterial color={d.color} transparent opacity={0.04} depthWrite={false} />
        </mesh>
      ))}

      {/* Neon Roads */}
      {roads.map((road, i) => {
        const isHighway = road.type === "highway";
        const isMain = road.type === "main";
        const isAlley = road.type === "alley";
        const isHoriz = road.width > road.length;
        
        const roadY = isHighway ? 0.025 : isMain ? 0.02 : 0.015;

        // Road surface — very dark, slightly reflective
        const surfaceW = road.width;
        const surfaceL = road.length;

        // Neon lane line dimensions
        const lineThickness = isHighway ? 0.12 : isMain ? 0.08 : 0.05;
        const lineLength = isHoriz ? surfaceW : surfaceL;
        
        // Edge lines offset from center
        const edgeOffset = isHoriz 
          ? (surfaceL / 2 - 0.15)
          : (surfaceW / 2 - 0.15);

        return (
          <group key={`${road.id}-${i}`} position={[road.x, 0, road.z]}>
            {/* Stencil cutout so the grid isn't drawn on the road, leaving pure black reflection */}
            <mesh 
              position={[0, roadY, 0]} 
              rotation={[-Math.PI / 2, 0, 0]} 
              geometry={planeGeom} 
              scale={[surfaceW, surfaceL, 1]} 
              frustumCulled={true}
              material={roadStencilMat}
            />

            {/* Neon center line — NEON CYAN (priority color) */}
            <mesh 
              position={[0, roadY + 0.005, 0]} 
              rotation={[-Math.PI / 2, 0, 0]} 
              geometry={planeGeom} 
              scale={isHoriz ? [lineLength, lineThickness, 1] : [lineThickness, lineLength, 1]} 
              frustumCulled={true}
            >
              <meshBasicMaterial color="#00ffff" toneMapped={false} transparent opacity={0.95} />
            </mesh>

            {/* Center line glow — soft cyan halo */}
            <mesh 
              position={[0, roadY + 0.004, 0]} 
              rotation={[-Math.PI / 2, 0, 0]} 
              geometry={planeGeom} 
              scale={isHoriz ? [lineLength, lineThickness * 7, 1] : [lineThickness * 7, lineLength, 1]} 
              frustumCulled={true}
            >
              <meshBasicMaterial color="#00ffff" toneMapped={false} transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>

            {!isAlley && (
              <>
                {/* Edge line 1 — NEON BLUE */}
                <mesh 
                  position={isHoriz ? [0, roadY + 0.005, -edgeOffset] : [-edgeOffset, roadY + 0.005, 0]} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  geometry={planeGeom} 
                  scale={isHoriz ? [lineLength, lineThickness * 0.7, 1] : [lineThickness * 0.7, lineLength, 1]} 
                  frustumCulled={true}
                >
                  <meshBasicMaterial color="#0066ff" toneMapped={false} transparent opacity={0.9} />
                </mesh>

                {/* Edge line 2 — NEON BLUE */}
                <mesh 
                  position={isHoriz ? [0, roadY + 0.005, edgeOffset] : [edgeOffset, roadY + 0.005, 0]} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  geometry={planeGeom} 
                  scale={isHoriz ? [lineLength, lineThickness * 0.7, 1] : [lineThickness * 0.7, lineLength, 1]} 
                  frustumCulled={true}
                >
                  <meshBasicMaterial color="#0066ff" toneMapped={false} transparent opacity={0.9} />
                </mesh>

                {/* Road surface glow bleed */}
                <mesh 
                  position={[0, roadY + 0.003, 0]} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  geometry={planeGeom} 
                  scale={[surfaceW, surfaceL, 1]} 
                  frustumCulled={true}
                >
                  <meshBasicMaterial color="#002244" toneMapped={false} transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </>
  );
}

