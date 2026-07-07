import { useMemo } from "react";
import * as THREE from "three";

export default function RetroMountains() {
  const geometry = useMemo(() => {
    // Match the ground grid width (approx 180-200) to stop it from sticking out sideways
    const geo = new THREE.PlaneGeometry(180, 40, 45, 10);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      const ny = (y + 20) / 40; 
      
      if (ny > 0.1) {
        // Smaller, more natural jagged peaks along the horizon
        let baseHeight = Math.abs(Math.sin(x * 0.04)) * 12 + Math.sin(x * 0.1) * 6 + Math.cos(x * 0.02) * 8;
        
        let z = baseHeight + (Math.random() - 0.5) * 4;
        
        // Scale displacement by depth
        pos.setZ(i, z * Math.pow(ny, 1.2));
      }
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group position={[0, -2, -90]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Solid dark silhouette */}
      <mesh geometry={geometry}>
        <meshBasicMaterial 
          color="#080016" 
          fog={false} // This stops the neon pink fog from covering the mountains!
        />
      </mesh>
    </group>
  );
}
