"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RoadData } from "@/lib/cityLayout";

interface LampPostsProps {
  roads: RoadData[];
}

export default function LampPosts({ roads }: LampPostsProps) {
  const polesRef = useRef<THREE.InstancedMesh>(null);
  const headsRef = useRef<THREE.InstancedMesh>(null);

  const { positions, lights } = useMemo(() => {
    const posList: { pos: THREE.Vector3; color: THREE.Color }[] = [];
    const colorCache = new Map<string, THREE.Color>();

    const getCol = (c: string) => {
      if (!colorCache.has(c)) colorCache.set(c, new THREE.Color(c));
      return colorCache.get(c)!;
    };

    roads.forEach((road) => {
      if (road.type === "alley") return;

      const isHoriz = road.width > road.length;
      const step = 8;
      // Roads are now dark asphalt colored, so we manually assign bright neon light colors
      const col = getCol(road.type === "highway" ? "#00ffff" : "#cc00ff");

      if (isHoriz) {
        const startX = road.x - road.width / 2;
        const endX = road.x + road.width / 2;
        for (let x = startX + step / 2; x < endX; x += step) {
          posList.push({ pos: new THREE.Vector3(x, 1.5, road.z - road.length / 2), color: col });
          posList.push({ pos: new THREE.Vector3(x, 1.5, road.z + road.length / 2), color: col });
        }
      } else {
        const startZ = road.z - road.length / 2;
        const endZ = road.z + road.length / 2;
        for (let z = startZ + step / 2; z < endZ; z += step) {
          posList.push({ pos: new THREE.Vector3(road.x - road.width / 2, 1.5, z), color: col });
          posList.push({ pos: new THREE.Vector3(road.x + road.width / 2, 1.5, z), color: col });
        }
      }
    });

    const sorted = [...posList].sort((a, b) => {
      const distA = a.pos.x * a.pos.x + a.pos.z * a.pos.z;
      const distB = b.pos.x * b.pos.x + b.pos.z * b.pos.z;
      return distA - distB;
    });

    const lightList = sorted.slice(0, 20);

    return { positions: posList, lights: lightList };
  }, [roads]);

  useMemo(() => {
    if (!polesRef.current || !headsRef.current) return;
    
    polesRef.current.count = positions.length;
    headsRef.current.count = positions.length;

    const dummy = new THREE.Object3D();
    
    positions.forEach((item, i) => {
      dummy.position.copy(item.pos);
      dummy.updateMatrix();
      polesRef.current!.setMatrixAt(i, dummy.matrix);
      polesRef.current!.setColorAt(i, item.color);
      
      dummy.position.copy(item.pos);
      dummy.position.y += 1.5;
      dummy.updateMatrix();
      headsRef.current!.setMatrixAt(i, dummy.matrix);
      headsRef.current!.setColorAt(i, item.color);
    });

    polesRef.current.instanceMatrix.needsUpdate = true;
    headsRef.current.instanceMatrix.needsUpdate = true;
    if (polesRef.current.instanceColor) polesRef.current.instanceColor.needsUpdate = true;
    if (headsRef.current.instanceColor) headsRef.current.instanceColor.needsUpdate = true;
  }, [positions]);

  if (positions.length === 0) return null;

  return (
    <>
      <instancedMesh ref={polesRef} args={[undefined, undefined, positions.length]} frustumCulled={true}>
        <cylinderGeometry args={[0.05, 0.05, 3]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>
      
      <instancedMesh ref={headsRef} args={[undefined, undefined, positions.length]} frustumCulled={true}>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>

      {lights.map((light, i) => (
        <pointLight
          key={i}
          position={[light.pos.x, light.pos.y + 1.5, light.pos.z]}
          color={light.color}
          intensity={2}
          distance={15}
        />
      ))}
    </>
  );
}
