import { GitHubFile } from "./github";

export interface BuildingData {
  id: string;
  x: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  color: string;
  emissiveColor: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  folderName: string;
  buildingType: "tower" | "slab" | "monument" | "bunker" | "residential";
}

export interface RoadData {
  id: string;
  x: number;
  z: number;
  width: number;
  length: number;
  type: "highway" | "main" | "alley";
  color: string;
}

const DISTRICT_COLORS = [
  { base: "#050505", emissive: "#00ffff" }, // Cyan
  { base: "#050505", emissive: "#ff00ff" }, // Magenta
  { base: "#050505", emissive: "#ffff00" }, // Yellow
  { base: "#050505", emissive: "#00ff88" }, // Green
  { base: "#050505", emissive: "#ff4400" }, // Orange
  { base: "#050505", emissive: "#4488ff" }, // Blue
  { base: "#050505", emissive: "#ff0088" }, // Pink
  { base: "#050505", emissive: "#88ff00" }, // Lime
];

function getBuildingType(size: number, fileName: string): BuildingData["buildingType"] {
  const ext = fileName.match(/\.[^.]+$/)?.[0] ?? "";
  if ([".md", ".txt"].includes(ext)) return "monument";
  if ([".json", ".yml", ".yaml", ".env"].includes(ext)) return "bunker";
  if ([".css", ".scss", ".html"].includes(ext)) return "slab";
  if (size > 10000 && [".ts", ".tsx", ".js", ".jsx"].includes(ext)) return "tower";
  return "residential"; // Default fallback
}

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getFileHeight(size: number, type: BuildingData["buildingType"], seed: number): number {
  let baseHeight = Math.max(2, Math.log2(size / 100));
  let multiplier = 1.0;
  switch (type) {
    case "tower": multiplier = 3.5; break; // Exaggerated skyline
    case "monument": multiplier = 3.0; break;
    case "slab": multiplier = 0.25; break; // Very low
    case "bunker": multiplier = 0.3; break;
    case "residential": multiplier = 1.0; break;
  }
  
  let height = baseHeight * multiplier;
  if (type === "bunker") height = Math.min(height, 3);
  
  const variance = 0.85 + seededRandom(seed) * 0.30;
  return height * variance;
}

function getBuildingFootprint(size: number, type: BuildingData["buildingType"]) {
  switch (type) {
    case "tower": return { width: 1.8, depth: 1.8 }; // Smaller footprints to allow tighter packing
    case "monument": return { width: 1.5, depth: 1.5 };
    case "slab": return { width: 2.0, depth: 1.5 };
    case "bunker": return { width: 2.0, depth: 2.0 };
    case "residential": return { width: 1.2, depth: 1.2 };
  }
}

export function buildCityLayout(files: GitHubFile[]): { buildings: BuildingData[]; roads: RoadData[] } {
  const cappedFiles = files.slice(0, 150);
  const buildings: BuildingData[] = [];
  const roads: RoadData[] = [];

  const districts = new Map<string, GitHubFile[]>();
  cappedFiles.forEach((file) => {
    const parts = file.path.split("/");
    const folder = parts.length > 1 ? parts[0] : "root";
    if (!districts.has(folder)) districts.set(folder, []);
    districts.get(folder)!.push(file);
  });

  const sortedDistricts = Array.from(districts.entries())
    .sort((a, b) => b[1].length - a[1].length);

  const districtPositions: { name: string; x: number; z: number; w: number; d: number; ring: number, colorIndex: number, dfiles: GitHubFile[], cols: number, rows: number }[] = [];

  sortedDistricts.forEach(([name, dfiles], i) => {
    // Math.min(7, dfiles.length) for BUILDINGS_PER_ROW = 7
    const cols = Math.min(7, dfiles.length);
    const rows = Math.ceil(dfiles.length / cols);
    
    // Tighter spacing: 2.2 for dense core, max 3.0 for outskirts
    const ring = i < 2 ? 0 : (i < 6 ? 1 : 2);
    const BLOCK_SIZE = ring === 0 ? 2.2 : (ring === 1 ? 2.5 : 3.0);
    
    const w = cols * BLOCK_SIZE;
    const d = rows * BLOCK_SIZE;
    
    // Greedy radial packer for tight gaps
    const gap = 3.0;
    let found = false;
    let rad = 0;
    let angle = 0;
    let x = 0, z = 0;
    
    while (!found) {
      x = Math.cos(angle) * rad;
      z = Math.sin(angle) * rad;
      let overlap = false;
      for (const p of districtPositions) {
        if (Math.abs(x - p.x) < (w + p.w) / 2 + gap && 
            Math.abs(z - p.z) < (d + p.d) / 2 + gap) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        found = true;
      } else {
        angle += 0.4;
        if (angle > Math.PI * 2) {
          angle = 0;
          rad += 1.0;
        }
      }
    }
    
    districtPositions.push({ 
      name, x, z, w, d, ring, colorIndex: i % 8, dfiles, cols, rows 
    });
  });

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  districtPositions.forEach(pos => {
    if (pos.x - pos.w / 2 < minX) minX = pos.x - pos.w / 2;
    if (pos.x + pos.w / 2 > maxX) maxX = pos.x + pos.w / 2;
    if (pos.z - pos.d / 2 < minZ) minZ = pos.z - pos.d / 2;
    if (pos.z + pos.d / 2 > maxZ) maxZ = pos.z + pos.d / 2;
  });

  const cityWidth = (maxX - minX) + 20;
  const cityDepth = (maxZ - minZ) + 20;
  const centerX = (maxX + minX) / 2;
  const centerZ = (maxZ + minZ) / 2;

  // 1. GENERATE ROADS FIRST
  // Highways - Dark grey asphalt
  roads.push({ id: `highway-h`, x: centerX, z: centerZ, width: cityWidth, length: 8, type: "highway", color: "#2a2a3a" });
  roads.push({ id: `highway-v`, x: centerX, z: centerZ, width: 8, length: cityDepth, type: "highway", color: "#2a2a3a" });

  const xGaps = new Set<number>();
  const zGaps = new Set<number>();
  
  for (let i = 0; i < districtPositions.length; i++) {
    for (let j = i + 1; j < districtPositions.length; j++) {
      const a = districtPositions[i];
      const b = districtPositions[j];
      const aMinX = a.x - a.w/2, aMaxX = a.x + a.w/2;
      const bMinX = b.x - b.w/2, bMaxX = b.x + b.w/2;
      const aMinZ = a.z - a.d/2, aMaxZ = a.z + a.d/2;
      const bMinZ = b.z - b.d/2, bMaxZ = b.z + b.d/2;
      
      if (Math.max(aMinZ, bMinZ) < Math.min(aMaxZ, bMaxZ)) {
        if (a.name !== b.name) {
          if (aMaxX < bMinX) xGaps.add((aMaxX + bMinX) / 2);
          if (bMaxX < aMinX) xGaps.add((bMaxX + aMinX) / 2);
        }
      }
      
      if (Math.max(aMinX, bMinX) < Math.min(aMaxX, bMaxX)) {
        if (a.name !== b.name) {
          if (aMaxZ < bMinZ) zGaps.add((aMaxZ + bMinZ) / 2);
          if (bMaxZ < aMinZ) zGaps.add((bMaxZ + aMinZ) / 2);
        }
      }
    }
  }

  // Main Roads - Darker grey asphalt
  Array.from(xGaps).forEach((gapX, i) => {
    if (Math.abs(gapX - centerX) > 8) {
      roads.push({ id: `main-v-${i}`, x: gapX, z: centerZ, width: 4, length: cityDepth, type: "main", color: "#1e1e2e" });
    }
  });

  Array.from(zGaps).forEach((gapZ, i) => {
    if (Math.abs(gapZ - centerZ) > 8) {
      roads.push({ id: `main-h-${i}`, x: centerX, z: gapZ, width: cityWidth, length: 4, type: "main", color: "#1e1e2e" });
    }
  });

  // Alleys - Near black asphalt, no center lines or edges, only for blocks > 20x20
  districtPositions.forEach((pos) => {
    if (pos.w > 20 && pos.d > 20) {
      if (pos.w >= pos.d) {
        roads.push({ id: `alley-v-${pos.name}`, x: pos.x, z: pos.z, width: 1.5, length: pos.d, type: "alley", color: "#141420" });
      } else {
        roads.push({ id: `alley-h-${pos.name}`, x: pos.x, z: pos.z, width: pos.w, length: 1.5, type: "alley", color: "#141420" });
      }
    }
  });

  // 2. ROAD BOUNDING BOXES FOR COLLISIONS
  const roadBoxes = roads.map(r => {
    const isHoriz = r.width > r.length;
    return {
      minX: r.x - r.width / 2,
      maxX: r.x + r.width / 2,
      minZ: r.z - r.length / 2,
      maxZ: r.z + r.length / 2,
      isHoriz,
      ...r
    };
  });

  // 3. PLACE BUILDINGS & AVOID COLLISIONS
  const JITTER = 0.4; // Reduced jitter for tighter packing
  
  districtPositions.forEach((pos, districtIndex) => {
    const BLOCK_SIZE = pos.ring === 0 ? 2.2 : (pos.ring === 1 ? 2.5 : 3.0);
    const halfW = pos.w / 2;
    const halfD = pos.d / 2;
    
    const colors = DISTRICT_COLORS[pos.colorIndex];

    pos.dfiles.forEach((file, i) => {
      const col = i % pos.cols;
      const row = Math.floor(i / pos.cols);

      const fileName = file.path.split("/").pop() ?? file.path;
      const type = getBuildingType(file.size, fileName);
      
      const seed = i + districtIndex * 100;
      const height = getFileHeight(file.size, type, seed);
      const { width: bw, depth: bd } = getBuildingFootprint(file.size, type);

      const jx = (seededRandom(seed) - 0.5) * JITTER;
      const jz = (seededRandom(seed + 1) - 0.5) * JITTER;

      let bx = pos.x + (col * BLOCK_SIZE - halfW) + BLOCK_SIZE / 2 + jx;
      let bz = pos.z + (row * BLOCK_SIZE - halfD) + BLOCK_SIZE / 2 + jz;

      // Push off roads
      roadBoxes.forEach(road => {
        const padding = 0.5;
        const rMinX = road.minX;
        const rMaxX = road.maxX;
        const rMinZ = road.minZ;
        const rMaxZ = road.maxZ;
        
        const bMinX = bx - bw / 2;
        const bMaxX = bx + bw / 2;
        const bMinZ = bz - bd / 2;
        const bMaxZ = bz + bd / 2;

        if (bMinX < rMaxX && bMaxX > rMinX && bMinZ < rMaxZ && bMaxZ > rMinZ) {
          if (road.isHoriz) {
            if (bz < road.z) bz = road.z - road.length / 2 - bd / 2 - padding;
            else bz = road.z + road.length / 2 + bd / 2 + padding;
          } else {
            if (bx < road.x) bx = road.x - road.width / 2 - bw / 2 - padding;
            else bx = road.x + road.width / 2 + bw / 2 + padding;
          }
        }
      });

      buildings.push({
        id: file.path,
        x: bx,
        z: bz,
        height,
        width: bw,
        depth: bd,
        color: colors.base,
        emissiveColor: colors.emissive,
        fileName,
        filePath: file.path,
        fileSize: file.size,
        folderName: pos.name,
        buildingType: type,
      });
    });
  });

  return { buildings, roads };
}
