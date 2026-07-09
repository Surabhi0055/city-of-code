"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

function InteractiveGridShader() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Track mouse coordinates normalized (-1 to 1)
  const mouse = useRef(new THREE.Vector2(-1000, -1000));
  // Track mouse world position intersecting the plane
  const mouseWorld = useRef(new THREE.Vector3(-1000, -1000, -1000));

  const { camera, raycaster } = useThree();

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useFrame(() => {
    if (materialRef.current && meshRef.current) {
      // Raycast from camera to the plane
      raycaster.setFromCamera(mouse.current, camera);
      const intersects = raycaster.intersectObject(meshRef.current);
      if (intersects.length > 0) {
        // Smoothly move the uniform towards the intersect point
        mouseWorld.current.lerp(intersects[0].point, 0.1);
        materialRef.current.uniforms.uMouse.value.copy(mouseWorld.current);
      }
      // Moving grid effect
      materialRef.current.uniforms.uTime.value += 0.02;
    }
  });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(0, 0, 0) },
      uColorPrimary: { value: new THREE.Color("#ff00cc") },
      uColorSecondary: { value: new THREE.Color("#00ffff") },
    }),
    []
  );

  const vertexShader = `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec3 vPosition;

    void main() {
      // Animate the Z coordinate to make the grid move towards the camera (slower)
      float movingZ = vPosition.z - uTime * 8.0;
      
      // Major grid - larger spacing
      float majorSpacing = 10.0;
      float majorThickness = 0.015; 
      float mx = step(abs(fract(vPosition.x / majorSpacing + 0.5) - 0.5), majorThickness / (2.0 * majorSpacing));
      float mz = step(abs(fract(movingZ / majorSpacing + 0.5) - 0.5), majorThickness / (2.0 * majorSpacing));
      float majorGrid = max(mx, mz);

      // Minor traces - continuous lines
      float minorSpacing = 2.0;
      float minorThickness = 0.01;
      
      float minorX = step(abs(fract(movingZ / minorSpacing + 0.5) - 0.5), minorThickness / (2.0 * minorSpacing));
      float minorZ = step(abs(fract(vPosition.x / minorSpacing + 0.5) - 0.5), minorThickness / (2.0 * minorSpacing));
      float minorGrid = max(minorX, minorZ);

      // Fade grid smoothly in the distance so it blends with the dark sky (no sharp edge)
      float distToCam = distance(cameraPosition, vPosition);
      float camFade = smoothstep(120.0, 20.0, distToCam);
      
      // Base lines intensity
      float lineIntensity = max(majorGrid * 1.0, minorGrid * 0.6);
      
      // Always visible grid, only fading at a distance
      float finalAlpha = lineIntensity * camFade;
      
      if (finalAlpha < 0.01) discard;

      // Global multi-colored grid matching the City Build
      vec3 c1 = vec3(0.0, 0.8, 0.8); // Softer Cyan
      vec3 c2 = vec3(0.85, 0.27, 0.93); // Fuchsia
      vec3 c3 = vec3(0.14, 0.38, 0.92); // Rich Blue
      vec3 c4 = vec3(0.57, 0.2, 0.91); // Rich Purple
      
      float nx = sin(vPosition.x * 0.05);
      // FIXED: Use static vPosition.z instead of movingZ so the colors don't strobe/flash!
      float nz = cos(vPosition.z * 0.05);
      vec3 colorA = mix(c1, c2, smoothstep(-1.0, 1.0, nx));
      vec3 colorB = mix(c3, c4, smoothstep(-1.0, 1.0, nz));
      vec3 baseColor = mix(colorA, colorB, smoothstep(-1.0, 1.0, nx * nz));
      
      gl_FragColor = vec4(baseColor, min(finalAlpha, 1.0));
    }
  `;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <planeGeometry args={[400, 400, 1, 1]} />
      <shaderMaterial
        key="v8-circuit-grid"
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function InteractiveGrid() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, background: "#06001a" }}>
      <Canvas camera={{ position: [0, 5, 30], fov: 60 }}>
        <fog attach="fog" args={["#06001a", 10, 80]} />
        <InteractiveGridShader />
        
        {/* Subtle Stars Background */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={500}
              array={new Float32Array(1500).map(() => (Math.random() - 0.5) * 300)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial size={0.6} color="#ffffff" transparent opacity={0.3} sizeAttenuation={true} />
        </points>
      </Canvas>
    </div>
  );
}
