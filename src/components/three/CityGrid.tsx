"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RoadData, DistrictData } from "@/lib/cityLayout";

interface CityGridProps {
  gridSize: number;
  roads?: RoadData[];
  districts?: DistrictData[];
  isHomepage?: boolean;
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
    uniform vec2 uPointer;
    uniform float uIsHomepage;
    uniform float uTime;
    varying vec3 vWorldPos;
    
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      // Animate the Z coordinate to make the grid move towards the camera
      float movingZ = vWorldPos.z + (uIsHomepage > 0.5 ? uTime * 15.0 : 0.0);
      
      // Major grid - larger spacing
      float majorSpacing = 10.0;
      float majorThickness = 0.015;
      float mx = step(abs(fract(vWorldPos.x / majorSpacing + 0.5) - 0.5), majorThickness / (2.0 * majorSpacing));
      float mz = step(abs(fract(movingZ / majorSpacing + 0.5) - 0.5), majorThickness / (2.0 * majorSpacing));
      float majorGrid = max(mx, mz);

      // Minor traces - less dense, larger rectangles
      float minorSpacing = 2.0;
      float minorThickness = 0.01;
      
      // X-directed minor lines (placed along Z)
      float zMinorId = floor(movingZ / minorSpacing);
      float xChunk = floor(vWorldPos.x / 4.0); // breaks every 4 units
      float drawXMinor = step(0.6, hash(vec2(zMinorId, xChunk))); 
      float minorX = drawXMinor * step(abs(fract(movingZ / minorSpacing + 0.5) - 0.5), minorThickness / (2.0 * minorSpacing));

      // Z-directed minor lines (placed along X)
      float xMinorId = floor(vWorldPos.x / minorSpacing);
      float zChunk = floor(movingZ / 4.0);
      float drawZMinor = step(0.6, hash(vec2(xMinorId + 100.0, zChunk)));
      float minorZ = drawZMinor * step(abs(fract(vWorldPos.x / minorSpacing + 0.5) - 0.5), minorThickness / (2.0 * minorSpacing));

      float minorGrid = max(minorX, minorZ);

      // Fade at far distance
      float distToCam = distance(cameraPosition, vWorldPos);
      float camFade = smoothstep(140.0, 40.0, distToCam);
      
      float distToCenter = length(vWorldPos.xz);
      float centerFade = smoothstep(80.0, 40.0, distToCenter);
      
      float distToPointer = distance(vWorldPos.xz, uPointer);
      float pointerFade = smoothstep(15.0, 0.0, distToPointer) * 8.0; // Larger, brighter spotlight
      
      // Decrease base fade so grid is a little faded (as requested), but gets extremely bright on hover
      float baseFade = mix(centerFade, centerFade * 0.15 + pointerFade, uIsHomepage);

      // Base lines intensity
      float lineIntensity = max(majorGrid * 1.5, minorGrid * 2.5);
      
      float finalAlpha = lineIntensity * camFade * baseFade;
      if (finalAlpha < 0.01) discard;

      // Global multi-colored grid
      vec3 c1 = vec3(0.0, 0.8, 0.8); // Softer Cyan
      vec3 c2 = vec3(0.85, 0.27, 0.93); // Fuchsia
      vec3 c3 = vec3(0.14, 0.38, 0.92); // Rich Blue
      vec3 c4 = vec3(0.57, 0.2, 0.91); // Rich Purple
      float nx = sin(vWorldPos.x * 0.05);
      float nz = cos(movingZ * 0.05);
      vec3 colorA = mix(c1, c2, smoothstep(-1.0, 1.0, nx));
      vec3 colorB = mix(c3, c4, smoothstep(-1.0, 1.0, nz));
      vec3 baseColor = mix(colorA, colorB, smoothstep(-1.0, 1.0, nx * nz));

      // Boost the color brightness heavily near the pointer
      float colorBoost = mix(1.0, 1.0 + pointerFade * 1.5, uIsHomepage);
      gl_FragColor = vec4(baseColor * 1.5 * colorBoost, min(finalAlpha, 1.0));
    }
  `
};

const dashedShaderArgs = {
  uniforms: { color: { value: new THREE.Color("#e0e0e0") } },
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying vec3 vWorldPos;
    void main() {
      float dist = vWorldPos.x + vWorldPos.z;
      if (mod(dist, 2.4) > 1.2) discard;
      gl_FragColor = vec4(color, 0.9);
    }
  `
};

const lightPoolShaderArgs = {
  uniforms: { color: { value: new THREE.Color("#ffdd44") } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      float dist = distance(vUv, vec2(0.5));
      float alpha = smoothstep(0.5, 0.0, dist);
      gl_FragColor = vec4(color, alpha * 0.5);
    }
  `
};

const roadStencilMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
roadStencilMat.stencilWrite = true;
roadStencilMat.stencilFunc = THREE.AlwaysStencilFunc;
roadStencilMat.stencilZPass = THREE.IncrementWrapStencilOp;

function StreetLight({ position, rotation, color }: { position: [number, number, number], rotation: [number, number, number], color: string }) {
  const lightColor = "#ffdd44"; // Warm yellow glow
  return (
    <group position={position} rotation={rotation}>
      {/* Dark pole */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.8]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      {/* Solid Lamp Head */}
      <mesh position={[0.04, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.08]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Soft glow falloff */}
      <mesh position={[0.04, 0.8, 0]}>
        <sphereGeometry args={[0.08]} />
        <meshBasicMaterial color={lightColor} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Soft blurred circular pool of light on road */}
      <mesh position={[0.04, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.0, 1.0]} />
        <shaderMaterial 
          args={[lightPoolShaderArgs]} 
          transparent={true} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function CityGrid({ gridSize, roads = [], districts = [], isHomepage = false }: CityGridProps) {
  const planeGeom = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const gridUniforms = useMemo(() => ({
    uPointer: { value: new THREE.Vector2(-1000, -1000) }, // Start off-screen so it's not bright in the center before mouse moves
    uIsHomepage: { value: isHomepage ? 1.0 : 0.0 },
    uTime: { value: 0.0 },
  }), [isHomepage]);

  useFrame((state, delta) => {
    gridUniforms.uTime.value += delta;
    if (isHomepage) {
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(state.pointer, state.camera);
      const intersect = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersect);
      if (intersect) {
        gridUniforms.uPointer.value.set(intersect.x, intersect.z);
      }
    }
  });

  const intersections = useMemo(() => {
    const list = [];
    const horizRoads = roads.filter(r => r.width > r.length && r.type !== "highway");
    const vertRoads = roads.filter(r => r.length > r.width && r.type !== "highway");
    for (const h of horizRoads) {
      for (const v of vertRoads) {
        if (v.x > h.x - h.width/2 && v.x < h.x + h.width/2 &&
            h.z > v.z - v.length/2 && h.z < v.z + v.length/2) {
          list.push({ x: v.x, z: h.z, w: v.width, d: h.length });
        }
      }
    }
    return list;
  }, [roads]);

  return (
    <>
      {/* Ground plane — wet road reflective surface (Asphalt) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} frustumCulled={true}>
        <planeGeometry args={[gridSize * 1.5, gridSize * 1.5]} />
        <MeshReflectorMaterial
          blur={[300, 300]} // Massive blur for soft light reflection
          resolution={1024}
          mixBlur={2.5}     // High mix blur
          mixStrength={25.0} // Very strong reflection
          roughness={0.2}   // Slightly rougher asphalt
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#030508"
          metalness={0.8}
          mirror={1}
        />
      </mesh>

      {/* The global circuit grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} frustumCulled={true}>
        <planeGeometry args={[gridSize * 1.5, gridSize * 1.5]} />
        <shaderMaterial 
          uniforms={gridUniforms}
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
        <mesh key={`district-${i}`} position={[d.x, 0.002, d.z]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={true}>
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
        
        const isElevated = isHighway;
        const baseRoadY = isElevated ? 1.5 : 0.0;
        const roadY = baseRoadY;
        const lineY = roadY + 0.003;

        // Road surface — very dark, slightly reflective
        const surfaceW = road.width;
        const surfaceL = road.length;

        // Dual track offset from center
        const trackOffset = isHighway ? 0.4 : isMain ? 0.25 : 0.12;
        const lineThickness = isHighway ? 0.14 : isMain ? 0.09 : 0.05;
        const lineLength = isHoriz ? surfaceW : surfaceL;
        const crossW = isHoriz ? surfaceL : surfaceW;
        const edgeOffset = crossW / 2 - 0.05;

        // Specific road colors as requested - changed to richer, less blinding neon
        // Specific road colors as requested - changed to richer, less blinding neon
        const trackColor = "#06b6d4"; // Rich teal/cyan tracks
        const edgeColor = "#06b6d4"; // Teal/cyan borders

        // Generate street lights
        const lights = [];
        if (!isAlley) {
           const lightSpacing = 2.5;
           const segments = Math.max(1, Math.floor(lineLength / lightSpacing));
           for (let j = 1; j < segments; j++) {
              const offsetAlong = -lineLength / 2 + (j * (lineLength / segments));
              let px1, pz1, px2, pz2;
              let rot1: [number, number, number], rot2: [number, number, number];
              if (isHoriz) {
                 px1 = road.x + offsetAlong; pz1 = road.z - edgeOffset - 0.05; rot1 = [0, 0, 0];
                 px2 = road.x + offsetAlong; pz2 = road.z + edgeOffset + 0.05; rot2 = [0, Math.PI, 0];
              } else {
                 px1 = road.x - edgeOffset - 0.05; pz1 = road.z + offsetAlong; rot1 = [0, Math.PI/2, 0];
                 px2 = road.x + edgeOffset + 0.05; pz2 = road.z + offsetAlong; rot2 = [0, -Math.PI/2, 0];
              }
              
              const inIntersection = (x: number, z: number) => {
                 return intersections.some(ix => 
                    Math.abs(x - ix.x) < ix.w/2 + 0.9 && 
                    Math.abs(z - ix.z) < ix.d/2 + 0.9
                 );
              };

              if (!inIntersection(px1, pz1)) {
                 lights.push(<StreetLight key={`l1-${j}`} position={[px1 - road.x, roadY, pz1 - road.z]} rotation={rot1} color={edgeColor} />);
              }
              if (!inIntersection(px2, pz2)) {
                 lights.push(<StreetLight key={`l2-${j}`} position={[px2 - road.x, roadY, pz2 - road.z]} rotation={rot2} color={edgeColor} />);
              }
           }
        }

        return (
          <group key={`${road.id}-${i}`} position={[road.x, 0, road.z]}>
            {/* Stencil cutout for ground roads ONLY */}
            {!isElevated && (
              <mesh 
                position={[0, roadY, 0]} 
                rotation={[-Math.PI / 2, 0, 0]} 
                geometry={planeGeom} 
                scale={[surfaceW, surfaceL, 1]} 
                frustumCulled={true}
                material={roadStencilMat}
                renderOrder={0}
              />
            )}

            {/* Dark shiny road surface removed since global ground is the asphalt */}

            {isElevated && (
              <>
                {/* Bridge Pillars */}
                <mesh position={[isHoriz ? -surfaceL/3 : 0, -roadY/2, isHoriz ? 0 : -surfaceL/3]}>
                   <cylinderGeometry args={[0.15, 0.15, roadY]} />
                   <meshBasicMaterial color="#050505" />
                </mesh>
                <mesh position={[isHoriz ? surfaceL/3 : 0, -roadY/2, isHoriz ? 0 : surfaceL/3]}>
                   <cylinderGeometry args={[0.15, 0.15, roadY]} />
                   <meshBasicMaterial color="#050505" />
                </mesh>
              </>
            )}

            {/* Center Dashed Track */}
            <mesh 
              position={[0, lineY, 0]} 
              rotation={[-Math.PI / 2, 0, 0]} 
              geometry={planeGeom} 
              scale={isHoriz ? [lineLength, lineThickness * 1.5, 1] : [lineThickness * 1.5, lineLength, 1]} 
              frustumCulled={true}
              renderOrder={1}
            >
              <shaderMaterial 
                args={[dashedShaderArgs]} 
                transparent={true} 
                depthWrite={false} 
                stencilWrite={!isElevated} 
                stencilRef={1} 
                stencilFunc={THREE.EqualStencilFunc} 
              />
            </mesh>

            {!isAlley && (
              <>
                {/* Edge line 1 */}
                <mesh 
                  position={isHoriz ? [0, lineY, -edgeOffset] : [-edgeOffset, lineY, 0]} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  geometry={planeGeom} 
                  scale={isHoriz ? [lineLength, 0.05, 1] : [0.05, lineLength, 1]} 
                  frustumCulled={true}
                  renderOrder={1}
                >
                  <meshBasicMaterial color={edgeColor} toneMapped={false} transparent opacity={0.9} stencilWrite={!isElevated} stencilRef={1} stencilFunc={THREE.EqualStencilFunc} />
                </mesh>

                {/* Edge line 2 */}
                <mesh 
                  position={isHoriz ? [0, lineY, edgeOffset] : [edgeOffset, lineY, 0]} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                  geometry={planeGeom} 
                  scale={isHoriz ? [lineLength, 0.05, 1] : [0.05, lineLength, 1]} 
                  frustumCulled={true}
                  renderOrder={1}
                >
                  <meshBasicMaterial color={edgeColor} toneMapped={false} transparent opacity={0.9} stencilWrite={!isElevated} stencilRef={1} stencilFunc={THREE.EqualStencilFunc} />
                </mesh>
              </>
            )}
            
            {/* Street Lights */}
            {lights}
          </group>
        );
      })}

      {/* Intersection Tiles to mask out overlapping neon tracks */}
      {intersections.map((ix, i) => (
        <mesh key={`ix-${i}`} position={[ix.x, 0.005, ix.z]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={true} renderOrder={2}>
          <planeGeometry args={[ix.w, ix.d]} />
          <meshBasicMaterial color="#020305" transparent={true} opacity={1.0} depthWrite={false} blending={THREE.NoBlending} />
        </mesh>
      ))}
    </>
  );
}
