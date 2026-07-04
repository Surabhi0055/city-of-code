"use client";

import { useMemo } from "react";

interface BuildingPos {
  x: number;
  z: number;
  width: number;
  depth: number;
}

interface CityGridProps {
  gridSize: number;
  buildings?: BuildingPos[];
}

export default function CityGrid({ gridSize, buildings = [] }: CityGridProps) {
  const center = useMemo(() => {
    if (buildings.length === 0) return { x: 0, z: 0 };
    let sx = 0, sz = 0;
    buildings.forEach(b => { sx += b.x; sz += b.z; });
    return { x: sx / buildings.length, z: sz / buildings.length };
  }, [buildings]);

  // Calculate exact road positions by finding the real gaps between buildings
  const roads = useMemo(() => {
    if (buildings.length === 0) return [];

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    buildings.forEach(b => {
      const hw = b.width / 2;
      const hd = b.depth / 2;
      if (b.x - hw < minX) minX = b.x - hw;
      if (b.x + hw > maxX) maxX = b.x + hw;
      if (b.z - hd < minZ) minZ = b.z - hd;
      if (b.z + hd > maxZ) maxZ = b.z + hd;
    });
    
    // Add some padding to the city bounds for the outer ring road
    const pad = 4;
    minX -= pad; maxX += pad; minZ -= pad; maxZ += pad;
    const cityW = maxX - minX;
    const cityD = maxZ - minZ;

    const result: { x: number; z: number; w: number; d: number; thick: boolean }[] = [];

    // --- Find Horizontal Gaps (roads along X, separating Z ranges) ---
    // We sort buildings by their minimum Z edge.
    const zRanges = buildings.map(b => ({ min: b.z - b.depth / 2, max: b.z + b.depth / 2 }))
                             .sort((a, b) => a.min - b.min);
    
    const hGaps: { center: number, size: number }[] = [];
    let currentMaxZ = zRanges[0].max;
    
    for (let i = 1; i < zRanges.length; i++) {
      const range = zRanges[i];
      if (range.min > currentMaxZ) {
        // We found a clean horizontal gap that spans the whole city!
        const gapSize = range.min - currentMaxZ;
        if (gapSize > 3) { // High threshold: only draw roads in the large gaps between districts
          hGaps.push({ center: (currentMaxZ + range.min) / 2, size: gapSize });
        }
      }
      currentMaxZ = Math.max(currentMaxZ, range.max);
    }

    // --- Find Vertical Gaps (roads along Z, separating X ranges) ---
    const xRanges = buildings.map(b => ({ min: b.x - b.width / 2, max: b.x + b.width / 2 }))
                             .sort((a, b) => a.min - b.min);
    
    const vGaps: { center: number, size: number }[] = [];
    let currentMaxX = xRanges[0].max;
    
    for (let i = 1; i < xRanges.length; i++) {
      const range = xRanges[i];
      if (range.min > currentMaxX) {
        const gapSize = range.min - currentMaxX;
        if (gapSize > 3) {
          vGaps.push({ center: (currentMaxX + range.min) / 2, size: gapSize });
        }
      }
      currentMaxX = Math.max(currentMaxX, range.max);
    }

    // Now, create the actual road meshes inside these perfect gaps
    // Center of the city
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    // Pick the most central gap to be the "Main Avenue" (thick)
    let bestHGap = hGaps.length > 0 ? hGaps[0] : null;
    let minHDist = Infinity;
    hGaps.forEach(gap => {
      const dist = Math.abs(gap.center - cz);
      if (dist < minHDist) { minHDist = dist; bestHGap = gap; }
    });

    hGaps.forEach(gap => {
      const isMain = gap === bestHGap;
      const roadWidth = isMain ? Math.min(gap.size - 0.5, 2.0) : Math.min(gap.size - 0.5, 1.0);
      result.push({ x: cx, z: gap.center, w: cityW, d: roadWidth, thick: isMain });
    });

    let bestVGap = vGaps.length > 0 ? vGaps[0] : null;
    let minVDist = Infinity;
    vGaps.forEach(gap => {
      const dist = Math.abs(gap.center - cx);
      if (dist < minVDist) { minVDist = dist; bestVGap = gap; }
    });

    vGaps.forEach(gap => {
      const isMain = gap === bestVGap;
      const roadWidth = isMain ? Math.min(gap.size - 0.5, 2.0) : Math.min(gap.size - 0.5, 1.0);
      result.push({ x: gap.center, z: cz, w: roadWidth, d: cityD, thick: isMain });
    });

    // Add ring roads around the very edge of the city to box it in
    result.push({ x: cx, z: minZ, w: cityW + pad, d: 1.0, thick: false });
    result.push({ x: cx, z: maxZ, w: cityW + pad, d: 1.0, thick: false });
    result.push({ x: minX, z: cz, w: 1.0, d: cityD + pad, thick: false });
    result.push({ x: maxX, z: cz, w: 1.0, d: cityD + pad, thick: false });

    return result;
  }, [buildings]);

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, -0.05, center.z]}>
        <planeGeometry args={[gridSize * 1.3, gridSize * 1.3]} />
        <meshStandardMaterial color="#020208" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Subtle background grid */}
      <gridHelper
        args={[gridSize * 1.3, Math.max(10, Math.floor(gridSize / 6)), "#0a1a2a", "#040810"]}
        position={[center.x, 0, center.z]}
      />

      {/* PERFECT ROADS — guaranteed to run exactly between buildings */}
      {roads.map((road, i) => (
        <group key={i}>
          {/* Road surface */}
          <mesh position={[road.x, 0.06, road.z]}>
            <boxGeometry args={[road.w, 0.12, road.d]} />
            <meshBasicMaterial color={road.thick ? "#8899aa" : "#667788"} />
          </mesh>
          {/* Bright edge lines on thick roads */}
          {road.thick && (
            <>
              <mesh position={[road.x, 0.14, road.z - road.d / 2]}>
                <boxGeometry args={[road.w, 0.06, 0.06]} />
                <meshBasicMaterial color="#bbccdd" />
              </mesh>
              <mesh position={[road.x, 0.14, road.z + road.d / 2]}>
                <boxGeometry args={[road.w, 0.06, 0.06]} />
                <meshBasicMaterial color="#bbccdd" />
              </mesh>
              <mesh position={[road.x - road.w / 2, 0.14, road.z]}>
                <boxGeometry args={[0.06, 0.06, road.d]} />
                <meshBasicMaterial color="#bbccdd" />
              </mesh>
              <mesh position={[road.x + road.w / 2, 0.14, road.z]}>
                <boxGeometry args={[0.06, 0.06, road.d]} />
                <meshBasicMaterial color="#bbccdd" />
              </mesh>
            </>
          )}
        </group>
      ))}
    </>
  );
}
