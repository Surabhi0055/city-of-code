"use client";

export default function CityGrid() {
  return (
    <>
      {/* Dark ground plane — sits just below the grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#050510"
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Neon cyan grid lines */}
      <gridHelper
        args={[200, 80, "#00ffff", "#003333"]}
      />
    </>
  );
}
