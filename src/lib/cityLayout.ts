import { GitHubFile } from "./github";

export interface BuildingData {
  id: string;
  x: number; // position on X axis
  z: number; // position on Z axis
  height: number; // tall buildings = big files
  color: string; // color by file type
  fileName: string;
  filePath: string;
  fileSize: number;
  folderName: string;
}

const FILE_COLORS: Record<string, string> = {
  ".ts":    "#00ffff",   // electric cyan
  ".tsx":   "#00eeff",   // bright sky blue
  ".js":    "#ffee00",   // neon yellow
  ".jsx":   "#ffcc00",   // gold
  ".css":   "#ff00ff",   // hot magenta
  ".scss":  "#ff44ff",   // neon pink
  ".json":  "#00ff88",   // matrix green
  ".md":    "#aaaaff",   // soft purple-white
  ".html":  "#ff6600",   // neon orange
  ".py":    "#4488ff",   // electric blue
  ".go":    "#00ffcc",   // aqua
  ".rs":    "#ff3300",   // neon red
  ".yml":   "#ffaa00",   // amber
  ".yaml":  "#ffaa00",   // amber
  ".env":   "#ff0055",   // danger red-pink
  ".sh":    "#44ff44",   // terminal green
  ".svg":   "#ff88ff",   // lavender
  ".png":   "#ff88aa",   // rose
  ".jpg":   "#ff6688",   // coral
};

function getFileColor(fileName: string): string {
  const ext = fileName.match(/\.[^.]+$/)?.[0] ?? "";
  return FILE_COLORS[ext] ?? "#888888"; // gray for unknown types
}

function getFileHeight(size: number): number {
  // Clamp height between 0.5 (tiny file) and 15 (massive file)
  const height = Math.log(size + 1) * 1.5;
  return Math.max(0.5, Math.min(height, 15));
}

export function buildCityLayout(files: GitHubFile[]): BuildingData[] {
  const buildings: BuildingData[] = [];

  const districts = new Map<string, GitHubFile[]>();
  files.forEach((file) => {
    const parts = file.path.split("/");
    const folder = parts.length > 1 ? parts[0] : "root";
    if (!districts.has(folder)) districts.set(folder, []);
    districts.get(folder)!.push(file);
  });

  // Sort districts by size (largest first)
  const districtList = Array.from(districts.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );
  
  const numDistricts = districtList.length;
  if (numDistricts === 0) return buildings;

  // Grid math for districts
  const DISTRICTS_PER_ROW = Math.ceil(Math.sqrt(numDistricts));
  const largestDistrictSize = districtList[0][1].length;
  const BUILDINGS_PER_ROW = Math.ceil(Math.sqrt(largestDistrictSize));
  
  const BUILDING_SPACING = 4.5;
  const DISTRICT_GAP = 15;

  // Calculate the "city block" size that every district gets
  const maxDistrictW = BUILDINGS_PER_ROW * BUILDING_SPACING + DISTRICT_GAP;
  const maxDistrictD = Math.ceil(largestDistrictSize / BUILDINGS_PER_ROW) * BUILDING_SPACING + DISTRICT_GAP;

  const totalCityW = DISTRICTS_PER_ROW * maxDistrictW;
  const totalCityD = Math.ceil(numDistricts / DISTRICTS_PER_ROW) * maxDistrictD;

  const offsetX = -totalCityW / 2;
  const offsetZ = -totalCityD / 2;

  districtList.forEach(([folderName, districtFiles], districtIndex) => {
    const districtCol = districtIndex % DISTRICTS_PER_ROW;
    const districtRow = Math.floor(districtIndex / DISTRICTS_PER_ROW);

    const districtOriginX = offsetX + districtCol * maxDistrictW + (maxDistrictW / 2);
    const districtOriginZ = offsetZ + districtRow * maxDistrictD + (maxDistrictD / 2);

    // Center the buildings inside their own district block
    const districtActualW = Math.min(districtFiles.length, BUILDINGS_PER_ROW) * BUILDING_SPACING;
    const districtActualD = Math.ceil(districtFiles.length / BUILDINGS_PER_ROW) * BUILDING_SPACING;

    const startX = districtOriginX - districtActualW / 2;
    const startZ = districtOriginZ - districtActualD / 2;

    districtFiles.forEach((file, i) => {
      const col = i % BUILDINGS_PER_ROW;
      const row = Math.floor(i / BUILDINGS_PER_ROW);

      const x = startX + col * BUILDING_SPACING;
      const z = startZ + row * BUILDING_SPACING;
      const fileName = file.path.split("/").pop() ?? file.path;

      buildings.push({
        id: file.path,
        x,
        z,
        height: getFileHeight(file.size),
        color: getFileColor(fileName),
        fileName,
        filePath: file.path,
        fileSize: file.size,
        folderName,
      });
    });
  });

  return buildings;
}
