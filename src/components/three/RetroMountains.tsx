import { useMemo } from "react";
import * as THREE from "three";

export default function RetroMountains() {
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
        <lineBasicMaterial
          color="#9900ff"
          toneMapped={false}
          transparent
          opacity={0.35}
          fog={false}
        />
      </lineSegments>
    </group>
  );
}
