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
  buildingType: "tower" | "block" | "slab" | "spire" | "antenna" | "stepped";
}

const FILE_COLORS: Record<string, { base: string; emissive: string }> = {
  ".ts":   { base: "#003333", emissive: "#00ffff" },
  ".tsx":  { base: "#003344", emissive: "#00eeff" },
  ".js":   { base: "#333300", emissive: "#ffee00" },
  ".jsx":  { base: "#332200", emissive: "#ffcc00" },
  ".css":  { base: "#330033", emissive: "#ff00ff" },
  ".scss": { base: "#440033", emissive: "#ff44ff" },
  ".json": { base: "#003322", emissive: "#00ff88" },
  ".md":   { base: "#222244", emissive: "#aaaaff" },
  ".html": { base: "#331100", emissive: "#ff6600" },
  ".py":   { base: "#001133", emissive: "#4488ff" },
  ".go":   { base: "#003333", emissive: "#00ffcc" },
  ".rs":   { base: "#330000", emissive: "#ff3300" },
  ".yml":  { base: "#332200", emissive: "#ffaa00" },
  ".yaml": { base: "#332200", emissive: "#ffaa00" },
  ".sh":   { base: "#003300", emissive: "#44ff44" },
  ".svg":  { base: "#330044", emissive: "#ff88ff" },
  ".env":  { base: "#330011", emissive: "#ff0055" },
};

function getFileColors(fileName: string) {
  const ext = fileName.match(/\.[^.]+$/)?.[0] ?? "";
  return FILE_COLORS[ext] ?? { base: "#111118", emissive: "#555566" };
}

function getFileHeight(size: number): number {
  if (size < 100)   return 1.5 + Math.random() * 1;
  if (size < 500)   return 3 + Math.random() * 2;
  if (size < 2000)  return 6 + Math.random() * 4;
  if (size < 10000) return 12 + Math.random() * 6;
  if (size < 50000) return 20 + Math.random() * 8;
  return 30 + Math.random() * 10;
}

function getBuildingFootprint(size: number, type: BuildingData["buildingType"]) {
  if (size < 200)   return { width: 0.8 + Math.random() * 0.4, depth: 0.8 + Math.random() * 0.4 };
  if (size < 1000)  return { width: 1.2 + Math.random() * 0.6, depth: 1.2 + Math.random() * 0.6 };
  if (size < 5000)  return { width: 2.0 + Math.random() * 1.0, depth: 1.5 + Math.random() * 1.0 };
  if (size < 20000) return { width: 3.0 + Math.random() * 1.5, depth: 2.5 + Math.random() * 1.5 };
  if (type === "slab") return { width: 5 + Math.random() * 2, depth: 1.5 + Math.random() * 1 };
  return { width: 3.5 + Math.random() * 2, depth: 3.5 + Math.random() * 2 };
}

function getBuildingType(size: number, fileName: string): BuildingData["buildingType"] {
  const ext = fileName.match(/\.[^.]+$/)?.[0] ?? "";
  if (size > 30000) return "tower";
  if (size > 15000) return "stepped";
  if (size > 5000)  return "block";
  if (size > 2000)  return "antenna";
  if ([".md", ".txt", ".svg", ".json"].includes(ext)) return "slab";
  return "spire";
}

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function buildCityLayout(files: GitHubFile[]): BuildingData[] {
  const buildings: BuildingData[] = [];

  // Group by top-level folder = districts
  const districts = new Map<string, GitHubFile[]>();
  files.forEach((file) => {
    const parts = file.path.split("/");
    const folder = parts.length > 1 ? parts[0] : "root";
    if (!districts.has(folder)) districts.set(folder, []);
    districts.get(folder)!.push(file);
  });

  const sortedDistricts = Array.from(districts.entries())
    .sort((a, b) => b[1].length - a[1].length);

  // ============================================================
  // SPIRAL PLACEMENT — districts radiate outward from the center
  // This naturally creates a square/circular city shape
  // ============================================================
  const BLOCK_SIZE = 5;    // Pack buildings tightly into districts again
  const STREET_GAP = 8;    // Keep a large gap between districts for the main roads
  const JITTER = 0.5;      // Reduced jitter to keep roads straighter

  // Place districts in a spiral pattern around center (0,0)
  // Spiral directions: right, down, left, up
  const spiralDirs = [
    { dx: 1, dz: 0 },   // right
    { dx: 0, dz: 1 },   // down
    { dx: -1, dz: 0 },  // left
    { dx: 0, dz: -1 },  // up
  ];

  // Calculate district block sizes
  const districtMetas = sortedDistricts.map(([name, files]) => {
    const cols = Math.ceil(Math.sqrt(files.length));
    const rows = Math.ceil(files.length / cols);
    // Size in world units
    const w = cols * BLOCK_SIZE;
    const d = rows * BLOCK_SIZE;
    return { name, files, cols, rows, w, d };
  });

  // Spiral placement of district origins
  const districtPositions: { x: number; z: number }[] = [];
  let spiralX = 0, spiralZ = 0;
  let spiralDir = 0;
  let spiralStepSize = 1;
  let spiralStepsTaken = 0;
  let spiralTurns = 0;

  for (let i = 0; i < districtMetas.length; i++) {
    const meta = districtMetas[i];

    // Place this district centered at (spiralX, spiralZ)
    const originX = spiralX * (BLOCK_SIZE * 4 + STREET_GAP);
    const originZ = spiralZ * (BLOCK_SIZE * 4 + STREET_GAP);
    districtPositions.push({ x: originX, z: originZ });

    // Move to next spiral position
    spiralX += spiralDirs[spiralDir].dx;
    spiralZ += spiralDirs[spiralDir].dz;
    spiralStepsTaken++;

    if (spiralStepsTaken >= spiralStepSize) {
      spiralStepsTaken = 0;
      spiralDir = (spiralDir + 1) % 4;
      spiralTurns++;
      if (spiralTurns % 2 === 0) spiralStepSize++;
    }
  }

  // Now place buildings within each district
  districtMetas.forEach((meta, districtIndex) => {
    const pos = districtPositions[districtIndex];
    const { files: districtFiles, cols } = meta;

    // Center the district's buildings around the district origin
    const halfW = (cols * BLOCK_SIZE) / 2;
    const rows = Math.ceil(districtFiles.length / cols);
    const halfD = (rows * BLOCK_SIZE) / 2;

    districtFiles.forEach((file, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const fileName = file.path.split("/").pop() ?? file.path;
      const height = getFileHeight(file.size);
      const type = getBuildingType(file.size, fileName);
      const { width, depth } = getBuildingFootprint(file.size, type);
      const colors = getFileColors(fileName);

      // Position within district, centered
      const seed = i + districtIndex * 100;
      const jx = (seededRandom(seed) - 0.5) * JITTER;
      const jz = (seededRandom(seed + 1) - 0.5) * JITTER;

      const x = pos.x + (col * BLOCK_SIZE - halfW) + BLOCK_SIZE / 2 + jx;
      const z = pos.z + (row * BLOCK_SIZE - halfD) + BLOCK_SIZE / 2 + jz;

      buildings.push({
        id: file.path,
        x,
        z,
        height,
        width,
        depth,
        color: colors.base,
        emissiveColor: colors.emissive,
        fileName,
        filePath: file.path,
        fileSize: file.size,
        folderName: meta.name,
        buildingType: type,
      });
    });
  });

  return buildings;
}
