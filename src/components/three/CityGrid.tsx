"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoadData } from "@/lib/cityLayout";

interface CityGridProps {
  gridSize: number;
  roads?: RoadData[];
}

export default function CityGrid({ gridSize, roads = [] }: CityGridProps) {
  const planeGeom = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  return (
    <>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} frustumCulled={true}>
        <planeGeometry args={[gridSize * 1.3, gridSize * 1.3]} />
        <meshStandardMaterial color="#020208" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Small square grid of neon on the base ground */}
      <gridHelper
        args={[gridSize * 1.3, Math.floor(gridSize * 1.3 / 1.5), "#225577", "#113344"]}
        position={[0, -0.04, 0]}
      />

      {roads.map((road, i) => {
        const isHighway = road.type === "highway";
        const isMain = road.type === "main";
        const isAlley = road.type === "alley";
        
        const yOffset = isHighway ? 0.05 : isMain ? 0.03 : 0.01;
        const isHoriz = road.width > road.length;
        
        const edgeGeom = (isHighway || isMain) ? new THREE.EdgesGeometry(new THREE.PlaneGeometry(road.width, road.length)) : null;

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
            {/* Dark asphalt road body with subtle wet emissive */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={planeGeom} scale={[road.width, road.length, 1]} frustumCulled={true}>
              <meshStandardMaterial color={road.color} emissive="#0a0a1a" roughness={0.3} metalness={0.5} />
            </mesh>
            
            {/* Subtle neon edge lines for main roads and highways */}
            {edgeGeom && (
              <lineSegments rotation={[-Math.PI / 2, 0, 0]} geometry={edgeGeom} frustumCulled={true}>
                <lineBasicMaterial color="#444466" toneMapped={false} />
              </lineSegments>
            )}

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
