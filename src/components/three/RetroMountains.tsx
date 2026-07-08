import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export default function RetroMountains({ isHomepage = false }: { isHomepage?: boolean }) {
  const geometry = useMemo(() => {
    // Match the ground grid width (approx 180-200) to stop it from sticking out sideways
    const geo = new THREE.PlaneGeometry(200, 44, 50, 12);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      const ny = (y + 22) / 44; 
      
      if (ny > 0.1) {
        // Smaller, more natural jagged peaks along the horizon
        let baseHeight = Math.abs(Math.sin(x * 0.04)) * 14 + Math.sin(x * 0.1) * 7 + Math.cos(x * 0.02) * 9;
        
        let z = baseHeight + (Math.random() - 0.5) * 4;
        
        // Scale displacement by depth
        pos.setZ(i, z * Math.pow(ny, 1.2));
      }
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Wireframe edge geometry for the neon outline on mountain silhouette
  const edgeGeom = useMemo(() => new THREE.EdgesGeometry(geometry, 10), [geometry]);

  const mountainUniforms = useMemo(() => ({
    uPointer: { value: new THREE.Vector2(-1000, -1000) },
    uIsHomepage: { value: isHomepage ? 1.0 : 0.0 },
  }), [isHomepage]);

  useFrame((state) => {
    if (isHomepage) {
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(state.pointer, state.camera);
      const intersect = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersect);
      if (intersect) {
        mountainUniforms.uPointer.value.set(intersect.x, intersect.z);
      }
    }
  });

  const mountainShader = useMemo(() => ({
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
      varying vec3 vWorldPos;
      
      void main() {
        // Use only the X distance so the mouse raycast accurately aligns with the mountain horizon!
        float distToPointer = abs(vWorldPos.x - uPointer.x);
        float pointerFade = smoothstep(30.0, 0.0, distToPointer) * 4.0;
        
        // Base opacity of mountain wireframe
        float baseOpacity = mix(0.8, 0.15 + pointerFade, uIsHomepage);
        float colorBoost = mix(1.0, 1.0 + pointerFade * 1.5, uIsHomepage);
        
        vec3 baseColor = vec3(0.85, 0.27, 0.93); // #d946ef
        gl_FragColor = vec4(baseColor * colorBoost, min(baseOpacity, 1.0));
      }
    `
  }), []);

  return (
    <group position={[0, -2, -90]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Solid dark silhouette */}
      <mesh geometry={geometry}>
        <meshBasicMaterial 
          color="#08001e" 
          fog={false} // This stops the neon pink fog from covering the mountains!
        />
      </mesh>
      {/* Neon violet edge outline on the mountain ridgeline */}
      <lineSegments geometry={edgeGeom}>
        <shaderMaterial
          uniforms={mountainUniforms}
          vertexShader={mountainShader.vertexShader}
          fragmentShader={mountainShader.fragmentShader}
          transparent={true}
          fog={false}
        />
      </lineSegments>
    </group>
  );
}
