"use client";

export default function CityGrid() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#050510" roughness={1} metalness={0} />
      </mesh>

      <gridHelper args={[200, 80, "#00ffff", "#003333"]} />
    </>
  );
}
