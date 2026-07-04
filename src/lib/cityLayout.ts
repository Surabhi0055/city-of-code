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
  ".ts": "#00ffff", // cyan    — TypeScript
  ".tsx": "#00ccff", // light blue — React TypeScript
  ".js": "#ffff00", // yellow  — JavaScript
  ".jsx": "#ffcc00", // gold    — React JavaScript
  ".css": "#ff00ff", // magenta — Styles
  ".scss": "#ff44ff", // pink    — Sass
  ".json": "#00ff88", // green   — Config
  ".md": "#ffffff", // white   — Docs
  ".html": "#ff6600", // orange  — HTML
  ".py": "#4444ff", // blue    — Python
  ".go": "#00ffaa", // teal    — Go
  ".rs": "#ff4400", // red     — Rust
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

  // Group files by their top-level folder
  const districts = new Map<string, GitHubFile[]>();

  files.forEach((file) => {
    const parts = file.path.split("/");
    const folder = parts.length > 1 ? parts[0] : "root";

    if (!districts.has(folder)) {
      districts.set(folder, []);
    }
    districts.get(folder)!.push(file);
  });

  // Place each district on the grid
  let districtX = 0;

  districts.forEach((districtFiles, folderName) => {
    let col = 0;
    let row = 0;
    const BUILDINGS_PER_ROW = 6;
    const BUILDING_SPACING = 3;
    const DISTRICT_SPACING = 8;

    districtFiles.forEach((file) => {
      const x = districtX + col * BUILDING_SPACING;
      const z = row * BUILDING_SPACING;
      const fileName = file.path.split("/").pop() ?? file.path;

      buildings.push({
        id: file.sha,
        x,
        z,
        height: getFileHeight(file.size),
        color: getFileColor(fileName),
        fileName,
        filePath: file.path,
        fileSize: file.size,
        folderName,
      });

      col++;
      if (col >= BUILDINGS_PER_ROW) {
        col = 0;
        row++;
      }
    });

    // Move to next district — width of current district + gap
    const districtWidth =
      Math.min(districtFiles.length, BUILDINGS_PER_ROW) * BUILDING_SPACING;
    districtX += districtWidth + DISTRICT_SPACING;
  });

  return buildings;
}
