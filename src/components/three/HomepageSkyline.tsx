"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * HomepageSkyline – renders silhouette buildings in the background
 * matching the synthwave/retrowave reference images.
 *
 * Each building is a dark box with a unique neon edge colour so the
 * skyline reads as distinct colour-coded blocks rather than one
 * uniform mass. Varied rooflines (flat, stepped, spired) give it the
 * Tokyo/HK density feel.
 */
export default function HomepageSkyline() {
  const buildings = useMemo(() => {
    // Hand-crafted archetypes inspired by the reference images
    // { x, z, w, d, h, top: "flat"|"step"|"spire", color }
    return ([
      // Far background row (z=-85 to -75) – muted, smaller
      { x: -70, z: -80, w: 10, d: 6, h: 25, top: "flat",   color: "#7700cc" },
      { x: -55, z: -82, w: 8,  d: 5, h: 32, top: "step",   color: "#9900ff" },
      { x: -40, z: -78, w: 14, d: 8, h: 20, top: "flat",   color: "#550099" },
      { x: -22, z: -82, w: 9,  d: 6, h: 28, top: "spire",  color: "#cc00ff" },
      { x:  -5, z: -80, w: 12, d: 7, h: 22, top: "flat",   color: "#6600aa" },
      { x:  12, z: -83, w: 10, d: 6, h: 35, top: "spire",  color: "#9900ee" },
      { x:  28, z: -79, w: 11, d: 7, h: 18, top: "flat",   color: "#770099" },
      { x:  44, z: -81, w: 9,  d: 5, h: 30, top: "step",   color: "#aa00ff" },
      { x:  60, z: -78, w: 13, d: 8, h: 24, top: "flat",   color: "#880077" },

      // Mid row (z=-65 to -60) – more variety, stronger neon
      { x: -80, z: -63, w: 12, d: 7,  h: 28, top: "flat",   color: "#ff00cc" },
      { x: -62, z: -65, w: 10, d: 6,  h: 42, top: "spire",  color: "#cc00ff" },
      { x: -45, z: -62, w: 16, d: 10, h: 20, top: "step",   color: "#aa00ff" },
      { x: -26, z: -64, w: 11, d: 7,  h: 50, top: "spire",  color: "#dd00ff" },
      { x:  -8, z: -61, w: 18, d: 12, h: 24, top: "flat",   color: "#9900cc" },
      { x:  14, z: -63, w: 12, d: 8,  h: 55, top: "spire",  color: "#ee00ff" },  // tallest
      { x:  32, z: -62, w: 14, d: 9,  h: 30, top: "step",   color: "#bb00ee" },
      { x:  50, z: -64, w: 10, d: 7,  h: 38, top: "spire",  color: "#ff00aa" },
      { x:  68, z: -62, w: 15, d: 9,  h: 22, top: "flat",   color: "#cc0099" },
      { x:  84, z: -63, w: 11, d: 6,  h: 34, top: "spire",  color: "#9900aa" },

      // Near sides – flank the road corridor, strongly lit
      { x: -92, z: -45, w: 14, d: 10, h: 35, top: "step",   color: "#00ffff" }, // cyan left
      { x: -76, z: -42, w: 10, d: 7,  h: 50, top: "spire",  color: "#ff00ff" }, // magenta
      { x:  78, z: -44, w: 12, d: 8,  h: 48, top: "spire",  color: "#ff00ff" }, // magenta right
      { x:  94, z: -42, w: 14, d: 10, h: 32, top: "step",   color: "#00ffff" }, // cyan
    ] as Array<{ x: number; z: number; w: number; d: number; h: number; top: "flat" | "step" | "spire"; color: string }>);
  }, []);

  return (
    <group>
      {buildings.map((b, i) => (
        <SkylineBuilding key={i} {...b} />
      ))}
    </group>
  );
}

interface SkylineBuildingProps {
  x: number; z: number; w: number; d: number; h: number;
  top: "flat" | "step" | "spire";
  color: string;
}

function SkylineBuilding({ x, z, w, d, h, top, color }: SkylineBuildingProps) {
  const bodyGeom  = useMemo(() => new THREE.BoxGeometry(w,      h,          d),      [w, h, d]);
  const bodyEdges = useMemo(() => new THREE.EdgesGeometry(bodyGeom),                  [bodyGeom]);

  // Step-top tier
  const stepH = h * 0.28;
  const stepW = w * 0.62;
  const stepD = d * 0.62;
  const stepGeom  = useMemo(() => new THREE.BoxGeometry(stepW, stepH, stepD), [stepW, stepH, stepD]);
  const stepEdges = useMemo(() => new THREE.EdgesGeometry(stepGeom),          [stepGeom]);

  // Spire cone
  const spireH = h * 0.35;
  const spireGeom  = useMemo(() => new THREE.CylinderGeometry(0.0, w * 0.18, spireH, 6), [w, spireH]);
  const spireEdges = useMemo(() => new THREE.EdgesGeometry(spireGeom),                    [spireGeom]);

  const bodyY  = h / 2;
  const stepY  = h + stepH / 2;
  const spireY = h + spireH / 2;

  return (
    <group position={[x, 0, z]}>
      {/* Dark silhouette body */}
      <mesh position={[0, bodyY, 0]} geometry={bodyGeom}>
        <meshBasicMaterial color="#06001a" />
      </mesh>
      {/* Neon edge wireframe */}
      <lineSegments position={[0, bodyY, 0]} geometry={bodyEdges}>
        <lineBasicMaterial color={color} toneMapped={false} transparent opacity={0.7} />
      </lineSegments>

      {/* Stepped roof tier */}
      {top === "step" && (
        <>
          <mesh position={[0, stepY, 0]} geometry={stepGeom}>
            <meshBasicMaterial color="#06001a" />
          </mesh>
          <lineSegments position={[0, stepY, 0]} geometry={stepEdges}>
            <lineBasicMaterial color={color} toneMapped={false} transparent opacity={0.8} />
          </lineSegments>
        </>
      )}

      {/* Spire */}
      {top === "spire" && (
        <>
          <mesh position={[0, spireY, 0]} geometry={spireGeom}>
            <meshBasicMaterial color="#06001a" />
          </mesh>
          <lineSegments position={[0, spireY, 0]} geometry={spireEdges}>
            <lineBasicMaterial color={color} toneMapped={false} transparent opacity={0.9} />
          </lineSegments>
          {/* Pulsing tip – handled via a simple always-visible sphere (no hooks needed) */}
          <mesh position={[0, h + spireH, 0]}>
            <sphereGeometry args={[0.22, 6, 6]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </>
      )}
    </group>
  );
}
