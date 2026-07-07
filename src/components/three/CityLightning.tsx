"use client";

import { useMemo, useState, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// A single lightning bolt that cracks between two points
function LightningBolt({
  start,
  end,
  color,
  intensity,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  intensity: number;
}) {
  // Generate jagged bolt path
  const lineObj = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 8;
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    dir.normalize();

    // Perpendicular vectors for displacement
    const up = new THREE.Vector3(0, 1, 0);
    const perp1 = new THREE.Vector3().crossVectors(dir, up).normalize();
    const perp2 = new THREE.Vector3().crossVectors(dir, perp1).normalize();

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const p = new THREE.Vector3().lerpVectors(start, end, t);

      if (i > 0 && i < segments) {
        const jitter = len * 0.08;
        p.addScaledVector(perp1, (Math.random() - 0.5) * jitter);
        p.addScaledVector(perp2, (Math.random() - 0.5) * jitter);
      }
      points.push(p);
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: intensity,
      toneMapped: false,
    });
    return new THREE.Line(geo, mat);
  }, [start, end, color, intensity]);

  return <primitive object={lineObj} />;
}

export default function CityLightning({ gridSize }: { gridSize: number }) {
  const [bolts, setBolts] = useState<
    { id: number; start: THREE.Vector3; end: THREE.Vector3; color: string; life: number }[]
  >([]);
  const timerRef = useRef(0);
  const idRef = useRef(0);

  const colors = ["#00e5ff", "#ff0080", "#7b2fff", "#ffffff", "#ffcc00"];

  useFrame((_, delta) => {
    timerRef.current += delta;

    // Spawn new bolt every 2-5 seconds
    if (timerRef.current > 2 + Math.random() * 3) {
      timerRef.current = 0;

      const range = gridSize * 0.35;
      const x1 = (Math.random() - 0.5) * range;
      const z1 = (Math.random() - 0.5) * range;
      const x2 = x1 + (Math.random() - 0.5) * 10;
      const z2 = z1 + (Math.random() - 0.5) * 10;

      const start = new THREE.Vector3(x1, 20 + Math.random() * 15, z1);
      const end = new THREE.Vector3(x2, 3 + Math.random() * 8, z2);
      const color = colors[Math.floor(Math.random() * colors.length)];

      setBolts((prev) => [
        ...prev.filter((b) => b.life > 0),
        { id: idRef.current++, start, end, color, life: 0.3 },
      ]);
    }

    // Decay bolt lifetimes
    setBolts((prev) =>
      prev
        .map((b) => ({ ...b, life: b.life - delta }))
        .filter((b) => b.life > 0)
    );
  });

  return (
    <group>
      {bolts.map((bolt) => (
        <LightningBolt
          key={bolt.id}
          start={bolt.start}
          end={bolt.end}
          color={bolt.color}
          intensity={Math.min(1, bolt.life * 5)}
        />
      ))}
    </group>
  );
}
