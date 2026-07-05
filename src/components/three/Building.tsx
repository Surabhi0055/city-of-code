"use client";

import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BuildingData } from "@/lib/cityLayout";

interface BuildingProps {
  data: BuildingData;
  onClick: (data: BuildingData) => void;
}

function useWindowTexture(seed: string, height: number, emissiveColor: string) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Pure black background so only windows emit light
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 128, 256);

    let s = 0;
    for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);
    const random = () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };

    const cols = 4;
    const rows = Math.max(4, Math.floor(height));
    const padding = 4;
    const w = (128 - padding * (cols + 1)) / cols;
    const h = (256 - padding * (rows + 1)) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padding + c * (w + padding);
        const y = padding + r * (h + padding);
        
        // Only a small percentage of windows are lit (performant & looks better)
        if (random() < 0.20) {
          // Draw pure white so the material's emissive color dictates the final tint
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = 0.7 + random() * 0.3; 
        } else {
          ctx.fillStyle = "#000000";
          ctx.globalAlpha = 1.0;
        }
        ctx.fillRect(x, y, w, h);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, [seed, height, emissiveColor]);
}

function NeonBox({
  width,
  height,
  depth,
  position,
  emissiveColor,
  hovered,
  windowTex,
  emissiveIntensityMult = 1,
  wireframeOnly = false,
}: {
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
  emissiveColor: string;
  hovered: boolean;
  windowTex?: THREE.Texture;
  emissiveIntensityMult?: number;
  wireframeOnly?: boolean;
}) {
  const geom = useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth]);
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(geom), [geom]);

  const tex = useMemo(() => {
    const t = windowTex?.clone();
    if (t) {
      t.repeat.set(Math.max(1, Math.floor(width / 2)), 1);
      t.needsUpdate = true;
    }
    return t;
  }, [windowTex, width]);

  useFrame((state, delta) => {
    if (hovered && tex) {
      tex.offset.y -= delta * 0.8; // Animate window lights falling downwards
    }
  });

  return (
    <group position={position}>
      {!wireframeOnly && (
        <mesh geometry={geom} frustumCulled={true}>
          <meshStandardMaterial
            color="#020208"
            emissive={emissiveColor}
            emissiveIntensity={(hovered ? 2.5 : 1.2) * emissiveIntensityMult}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.95}
            map={tex}
            emissiveMap={tex}
          />
        </mesh>
      )}
      <lineSegments geometry={edgesGeom} frustumCulled={true}>
        <lineBasicMaterial
          color={hovered ? "#ffffff" : emissiveColor}
          toneMapped={false}
          transparent={false}
        />
      </lineSegments>
    </group>
  );
}

function BuildingComponent({ data, onClick }: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const windowTex = useWindowTexture(data.id, data.height, data.emissiveColor);

  return (
    <group
      position={[data.x, -0.02, data.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(data);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {/* Ground Skirt to plant the building visually */}
      <mesh position={[0, 0.15, 0]} frustumCulled={true}>
        <boxGeometry args={[data.width, 0.3, data.depth]} />
        <meshStandardMaterial color="#000000" emissive="#000000" emissiveIntensity={0} roughness={0.9} />
      </mesh>

      {/* Main Building Group - offset by skirt height to prevent clipping */}
      <group position={[0, 0.3, 0]}>
        {data.buildingType === "tower" && (
          <>
            <NeonBox
              width={data.width}
              height={data.height * 0.6}
              depth={data.depth}
              position={[0, data.height * 0.3, 0]}
              emissiveColor={data.emissiveColor}
              hovered={hovered}
              windowTex={windowTex}
            />
            <NeonBox
              width={data.width * 0.8}
              height={data.height * 0.25}
              depth={data.depth * 0.8}
              position={[0, data.height * 0.6 + data.height * 0.125, 0]}
              emissiveColor={data.emissiveColor}
              hovered={hovered}
              windowTex={windowTex}
            />
            <NeonBox
              width={data.width * 0.6}
              height={data.height * 0.15}
              depth={data.depth * 0.6}
              position={[0, data.height * 0.85 + data.height * 0.075, 0]}
              emissiveColor={data.emissiveColor}
              hovered={hovered}
              windowTex={windowTex}
            />
            <group position={[0, data.height + 1.0, 0]}>
              <mesh frustumCulled={true}>
                <cylinderGeometry args={[0.08, 0.08, 2]} />
                <meshBasicMaterial color={data.emissiveColor} toneMapped={false} />
              </mesh>
            </group>
            {/* Tower Crown */}
            <mesh position={[0, data.height + 0.6, 0]}>
              <boxGeometry args={[data.width * 0.5, 1.2, data.depth * 0.5]} />
              <meshStandardMaterial
                color={data.color}
                emissive={data.emissiveColor}
                emissiveIntensity={1.2}
                roughness={0.1}
                metalness={0.9}
              />
            </mesh>
          </>
        )}

        {data.buildingType === "slab" && (
          <>
            <NeonBox
              width={data.width}
              height={data.height}
              depth={data.depth}
              position={[0, data.height / 2, 0]}
              emissiveColor={data.emissiveColor}
              hovered={hovered}
              windowTex={windowTex}
            />
            <NeonBox
              width={data.width * 0.8}
              height={data.height * 0.1}
              depth={data.depth * 0.8}
              position={[0, data.height + data.height * 0.05, 0]}
              emissiveColor={data.emissiveColor}
              hovered={hovered}
              windowTex={windowTex}
            />
            {/* Slab Rooftop Structures */}
            <mesh position={[-data.width * 0.25, data.height + 0.3, 0]}>
              <boxGeometry args={[1.2, 0.6, 1.2]} />
              <meshStandardMaterial color={data.color} emissive={data.emissiveColor} emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[data.width * 0.25, data.height + 0.5, 0]}>
              <boxGeometry args={[0.8, 1, 0.8]} />
              <meshStandardMaterial color={data.color} emissive={data.emissiveColor} emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
            </mesh>
          </>
        )}

        {data.buildingType === "spire" && (
          <>
            {[0, 1, 2, 3, 4].map((i) => {
              const h = data.height * 0.2;
              const w = data.width * Math.pow(0.85, i);
              const d = data.depth * Math.pow(0.85, i);
              return (
                <NeonBox
                  key={i}
                  width={w}
                  height={h}
                  depth={d}
                  position={[0, i * h + h / 2, 0]}
                  emissiveColor={data.emissiveColor}
                  hovered={hovered}
                  windowTex={windowTex}
                  emissiveIntensityMult={1.0} 
                />
              );
            })}
            {/* Spire Cone Tip */}
            <mesh position={[0, data.height + 1, 0]}>
              <coneGeometry args={[0.4, 2, 4]} />
              <meshStandardMaterial
                color={data.color}
                emissive={data.emissiveColor}
                emissiveIntensity={2}
                roughness={0.1}
                metalness={1}
              />
            </mesh>
          </>
        )}

        {data.buildingType === "block" && (
          <>
            <NeonBox
              width={data.width}
              height={data.height}
              depth={data.depth}
              position={[0, data.height / 2, 0]}
              emissiveColor={data.emissiveColor}
              hovered={hovered}
              windowTex={windowTex}
            />
            <NeonBox
              width={data.width + 0.4}
              height={data.height + 0.2}
              depth={data.depth + 0.4}
              position={[0, (data.height + 0.2) / 2, 0]}
              emissiveColor={data.emissiveColor}
              hovered={hovered}
              wireframeOnly={true}
            />
            {/* Block Rooftop Mechanical Box */}
            <mesh position={[data.width * 0.2, data.height + 0.4, 0]}>
              <boxGeometry args={[data.width * 0.3, 0.8, data.depth * 0.4]} />
              <meshStandardMaterial
                color={data.color}
                emissive={data.emissiveColor}
                emissiveIntensity={0.8}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
          </>
        )}


        {data.buildingType === "residential" && (
          <NeonBox
            width={data.width}
            height={data.height}
            depth={data.depth}
            position={[0, data.height / 2, 0]}
            emissiveColor={data.emissiveColor}
            hovered={hovered}
            windowTex={windowTex}
          />
        )}
      </group>
    </group>
  );
}

// React.memo prevents the building from re-rendering unless its hovered state (internal) 
// or data (which is stable) changes.
export default React.memo(BuildingComponent, (prev, next) => {
  return prev.data.id === next.data.id;
});
