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
  buildingType: "tower" | "slab" | "block" | "spire" | "residential";
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
  { base: "#050510", emissive: "#00ffff" },  // pure cyan       — PRIMARY (largest folder)
  { base: "#050510", emissive: "#2563eb" },  // richer blue  — 2nd largest
  { base: "#050510", emissive: "#d946ef" },  // aesthetic fuchsia    — 3rd
  { base: "#050510", emissive: "#38bdf8" },  // softer sky blue   — 4th
  { base: "#050510", emissive: "#f472b6" },  // pastel pink       — 5th
  { base: "#050510", emissive: "#4338ca" },  // deep indigo  — 6th
  { base: "#050510", emissive: "#9333ea" },  // rich purple     — 7th
  { base: "#050510", emissive: "#e11d48" },  // rose red  — 8th
  { base: "#050510", emissive: "#f97316" },  // burnt orange     — 9th
  { base: "#050510", emissive: "#e62b6f" },  // softer neon pink        — 10th
];

function getBuildingType(size: number, fileName: string): BuildingData["buildingType"] {
  const ext = fileName.match(/\.[^.]+$/)?.[0] ?? "";
  if ([".md", ".txt"].includes(ext)) return "spire";
  if ([".json", ".yml", ".yaml", ".env"].includes(ext)) return "block";
  if ([".css", ".scss", ".html"].includes(ext)) return "slab";
  if ([".ts", ".tsx", ".js", ".jsx", ".py", ".cpp", ".c", ".java", ".go", ".rs"].includes(ext)) return "tower";
  return "residential"; // Default fallback (Misc files)
}

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getFileHeight(size: number, type: BuildingData["buildingType"], seed: number): number {
  let baseHeight = Math.max(2, Math.log2(size / 100));
  
  // Significantly boost height for very large files so they stand out as major landmarks
  if (size > 10000) {
    // Cap the bonus to 25 so massive generated files don't break the skybox
    const bonus = Math.min((size - 10000) / 1500, 25);
    baseHeight += bonus;
  }

  let multiplier = 1.0;
  switch (type) {
    case "tower": multiplier = 2.0; break;    // Tall but not absurd
    case "spire": multiplier = 2.5; break;    // Tallest — the landmark buildings
    case "slab": multiplier = 0.6; break;     // Low-rise commercial blocks
    case "block": multiplier = 0.8; break;    // Medium office blocks
    case "residential": multiplier = 1.2; break;
  }
  
  let height = baseHeight * multiplier;
  if (type === "block") height = Math.min(height, 5);
  
  const variance = 0.85 + seededRandom(seed) * 0.30;
  return height * variance;
}

/**
 * Building footprint scales with height so taller buildings occupy more
 * land — matching real-world skyscraper massing and the reference images.
 * footprintScale caps at 2.0 to prevent giant footprints on extreme files.
 */
function getBuildingDimensions(type: BuildingData["buildingType"], seed: number, height: number) {
  const rand = seededRandom(seed);
  // Gentle sqrt curve: taller → wider, but diminishing returns
  const footprintScale = Math.min(2.0, 0.85 + Math.sqrt(height) * 0.22);
  switch (type) {
    case "tower":
      return {
        width: (1.4 + rand * 0.9) * footprintScale,
        depth: (1.4 + rand * 0.9) * footprintScale,
      };
    case "block":
      return {
        width: (1.8 + rand * 0.5) * footprintScale,
        depth: (1.8 + rand * 0.5) * footprintScale,
      };
    case "slab":
      return {
        width: (2.0 + rand * 0.4) * footprintScale,
        depth: (1.4 + rand * 0.6) * footprintScale,
      };
    case "spire":
      return {
        width: (1.0 + rand * 0.5) * footprintScale,
        depth: (1.0 + rand * 0.5) * footprintScale,
      };
    default:
      return {
        width: 1.7 * footprintScale,
        depth: 1.7 * footprintScale,
      };
  }
}

export interface DistrictData {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
}

export function buildCityLayout(files: GitHubFile[]): { buildings: BuildingData[]; roads: RoadData[]; districts: DistrictData[] } {
  const cappedFiles = files.slice(0, 100);
  const buildings: BuildingData[] = [];
  const roads: RoadData[] = [];
  const districtsData: DistrictData[] = [];

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
    const BUILDINGS_PER_ROW = 6;
    const cols = Math.min(BUILDINGS_PER_ROW, dfiles.length);
    const rows = Math.ceil(dfiles.length / cols);
    
    // Increased from 2.4 → 6.0 so larger footprints never touch each other
    const BUILDING_SPACING = 6.0;
    const BLOCK_SIZE = BUILDING_SPACING;
    const ring = i < 2 ? 0 : (i < 6 ? 1 : 2);
    
    const w = cols * BLOCK_SIZE;
    const d = rows * BLOCK_SIZE;
    
    // Greedy radial packer — gap increased to 5.0 to fit wider roads between districts
    const DISTRICT_GAP = 5.0;
    let found = false;
    let rad = 0;
    let angle = 0;
    let x = 0, z = 0;
    
    while (!found) {
      x = Math.cos(angle) * rad;
      z = Math.sin(angle) * rad;
      let overlap = false;
      for (const p of districtPositions) {
        if (Math.abs(x - p.x) < (w + p.w) / 2 + DISTRICT_GAP && 
            Math.abs(z - p.z) < (d + p.d) / 2 + DISTRICT_GAP) {
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
      name, x, z, w, d, ring, colorIndex: i % 10, dfiles, cols, rows 
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
  // Central Main Roads (formerly highways)
  roads.push({ id: `center-main-h`, x: centerX, z: centerZ, width: cityWidth, length: 2.5, type: "main", color: "#1e1e2e" });
  roads.push({ id: `center-main-v`, x: centerX, z: centerZ, width: 2.5, length: cityDepth, type: "main", color: "#1e1e2e" });

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
    if (Math.abs(gapX - centerX) > 5) {
      roads.push({ id: `main-v-${i}`, x: gapX, z: centerZ, width: 2.5, length: cityDepth, type: "main", color: "#1e1e2e" });
    }
  });

  Array.from(zGaps).forEach((gapZ, i) => {
    if (Math.abs(gapZ - centerZ) > 5) {
      roads.push({ id: `main-h-${i}`, x: centerX, z: gapZ, width: cityWidth, length: 2.5, type: "main", color: "#1e1e2e" });
    }
  });

  // Alleys - Near black asphalt, no center lines or edges, only for blocks > 20x20
  districtPositions.forEach((pos) => {
    if (pos.w > 20 && pos.d > 20) {
      if (pos.w >= pos.d) {
        roads.push({ id: `alley-v-${pos.name}`, x: pos.x, z: pos.z, width: 1.0, length: pos.d, type: "alley", color: "#141420" });
      } else {
        roads.push({ id: `alley-h-${pos.name}`, x: pos.x, z: pos.z, width: pos.w, length: 1.0, type: "alley", color: "#141420" });
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
  const JITTER = 0.3; 
  districtPositions.forEach((pos, districtIndex) => {
    const BUILDING_SPACING = 6.0;
    const BLOCK_SIZE = BUILDING_SPACING;
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
      // Pass height so footprint scales with building size
      const { width: bw, depth: bd } = getBuildingDimensions(type, seed, height);

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

    districtsData.push({
      id: pos.name,
      x: pos.x,
      z: pos.z,
      w: pos.w,
      d: pos.d,
      color: DISTRICT_COLORS[pos.colorIndex].emissive,
    });

  });

  return { buildings, roads, districts: districtsData };
}
