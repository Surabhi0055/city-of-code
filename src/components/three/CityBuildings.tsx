"use client";

import { BuildingData } from "@/lib/cityLayout";
import Building from "./Building";

interface CityBuildingsProps {
  buildings: BuildingData[];
  onBuildingClick: (data: BuildingData) => void;
  searchQuery?: string;
}

export default function CityBuildings({ buildings, onBuildingClick, searchQuery }: CityBuildingsProps) {
  return (
    <>
      {buildings.map((building) => (
        <Building
          key={building.id}
          data={building}
          onClick={onBuildingClick}
          searchQuery={searchQuery}
        />
      ))}
    </>
  );
}
