"use client";

import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BuildingData } from "@/lib/cityLayout";

interface BuildingProps {
  data: BuildingData;
  onClick: (data: BuildingData) => void;
}

function makeRandom(seed: string) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s += seed.charCodeAt(i);
  return () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
}

function tintedBody(neonHex: string): string {
  const c = new THREE.Color(neonHex);
  const r = Math.floor(c.r * 28).toString(16).padStart(2, "0");
  const g = Math.floor(c.g * 18).toString(16).padStart(2, "0");
  const b = Math.floor(c.b * 38).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

// ── Sparse window shader ─────────────────────────────────────────────────────
// • Variable window sizes: small square | wide horizontal | tall vertical
// • Only ~22 % of cells are lit — lots of dark wall between windows
// • Brightness gradient: top and bottom sections brighter, middle dimmer
const sparseWinVert = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv     = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sparseWinFrag = `
  uniform vec3  uNeon;
  uniform float uSeed;
  uniform float uWidth;
  uniform float uHeight;
  uniform float uDepth;
  uniform vec3  uBody;
  uniform float uTime;
  uniform float uHover;

  varying vec2 vUv;
  varying vec3 vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p + uSeed * 0.0137, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    if (abs(vNormal.y) > 0.5) { gl_FragColor = vec4(uBody, 1.0); return; }

    float faceW = abs(vNormal.z) > 0.5 ? uWidth : uDepth;

    // Sparse grid: 1 slot per ~1.3 units wide, 1.0 unit tall
    float cols = max(2.0, floor(faceW   / 1.3));
    float rows = max(2.0, floor(uHeight / 1.0));

    vec2 cell   = floor(vec2(vUv.x * cols, vUv.y * rows));
    vec2 cellUv = fract(vec2(vUv.x * cols, vUv.y * rows));

    float h1 = hash(cell);
    float h2 = hash(cell + vec2(5.7, 9.3));
    float h3 = hash(cell + vec2(2.1, 8.4)); // window shape
    float h4 = hash(cell + vec2(6.3, 1.7)); // size tweak

    // Only ~22 % of slots are lit with regular windows
    if (h1 > 0.22) { 
      // Before returning dark wall, maybe there's a tiny white blinking window here
      float scroll = uHover > 0.5 ? uTime * 0.4 : 0.0;
      vec2 adjustedUv = vec2(vUv.x, vUv.y - scroll);
      float tinyCols = max(6.0, floor(faceW / 0.2));
      float tinyRows = max(6.0, floor(uHeight / 0.2));
      vec2 tinyCell = floor(vec2(adjustedUv.x * tinyCols, adjustedUv.y * tinyRows));
      vec2 tinyUv = fract(vec2(adjustedUv.x * tinyCols, adjustedUv.y * tinyRows));
      float th = hash(tinyCell + uSeed * 2.1);
      
      // 4% chance of a tiny white blinking dot in the dark space
      if (th < 0.04) {
         if (tinyUv.x > 0.3 && tinyUv.x < 0.7 && tinyUv.y > 0.3 && tinyUv.y < 0.7) {
            float blink = step(0.5, sin(uTime * 8.0 + th * 20.0));
            gl_FragColor = vec4(vec3(1.0) * blink, 1.0);
            return;
         }
      }
      
      gl_FragColor = vec4(uBody, 1.0); 
      return; 
    }

    // ── Variable window shape ──────────────────────────────────────────────
    // h3 < 0.33  →  small square
    // h3 < 0.66  →  wide landscape rectangle
    // h3 < 1.00  →  tall portrait rectangle
    float brdX, brdY;
    if (h3 < 0.33) {
      // Small square — roughly equal padding all sides
      brdX = 0.25 + h4 * 0.09;
      brdY = 0.25 + h4 * 0.09;
    } else if (h3 < 0.66) {
      // Wide horizontal rectangle — thin vertically, wide horizontally
      brdX = 0.08 + h4 * 0.07;
      brdY = 0.28 + h4 * 0.12;
    } else {
      // Tall vertical rectangle — wide vertically, thin horizontally
      brdX = 0.28 + h4 * 0.10;
      brdY = 0.07 + h4 * 0.06;
    }

    bool inWin = cellUv.x > brdX && cellUv.x < (1.0 - brdX)
              && cellUv.y > brdY && cellUv.y < (1.0 - brdY);

    if (!inWin) { gl_FragColor = vec4(uBody, 1.0); return; }

    // ── Brightness gradient: bright at top + bottom, dimmer in middle ──────
    float posY        = vUv.y;
    float topGlow     = smoothstep(0.62, 0.88, posY);
    float bottomGlow  = smoothstep(0.38, 0.12, posY);
    float edgeBright  = max(topGlow, bottomGlow);
    float brightFactor = mix(0.58, 1.0, edgeBright); // 0.58 in middle → 1.0 at edges

    // Window colour: warm white 55 % | neon colour 45 %
    float lumBoost = 0.55 + h2 * 0.45;
    vec3 winColor;
    if (h2 < 0.55) {
      winColor = vec3(lumBoost * 0.96, lumBoost * 0.89, lumBoost * 0.64); // warm white
    } else {
      winColor = uNeon * lumBoost;
    }
    winColor *= brightFactor;

    gl_FragColor = vec4(winColor, 1.0);
  }
`;

// ── Pulsing beacon ───────────────────────────────────────────────────────────
function Beacon({ color, y }: { color: string; y: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const p = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4.0);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.65 * p;
    }
  });
  return (
    <mesh ref={ref} position={[0, y, 0]}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent opacity={1} />
    </mesh>
  );
}

// ── Horizontal neon band (all 4 sides) ───────────────────────────────────────
function NeonBand({ w, d, y, color, opacity = 0.92 }: {
  w: number; d: number; y: number; color: string; opacity?: number;
}) {
  const h = 0.09;
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0,  d / 2 + 0.012]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={opacity} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, 0, -d / 2 - 0.012]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={opacity} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[ w / 2 + 0.012, 0, 0]} rotation={[0,  Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={opacity} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[-w / 2 - 0.012, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshBasicMaterial color={color} toneMapped={false} transparent opacity={opacity} side={THREE.FrontSide} />
      </mesh>
    </group>
  );
}

// ── Vertical strip ────────────────────────────────────────────────────────────
function VStrip({ x, z, rot, height, color }: {
  x: number; z: number; rot: number; height: number; color: string;
}) {
  return (
    <mesh position={[x, height / 2, z]} rotation={[0, rot, 0]}>
      <planeGeometry args={[0.08, height]} />
      <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.88} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Vertical Sign Board ──────────────────────────────────────────────────────
const signBoardVert = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const signBoardFrag = `
  uniform vec3 uColor;
  uniform float uSeed;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    float cells = floor(10.0 + hash(vec2(uSeed)) * 10.0);
    vec2 cell = floor(vec2(0.0, vUv.y * cells));
    vec2 cellUv = fract(vec2(vUv.x, vUv.y * cells));
    
    // borders
    if (vUv.x < 0.1 || vUv.x > 0.9 || vUv.y < 0.02 || vUv.y > 0.98) {
      gl_FragColor = vec4(uColor * 0.4, 1.0);
      return;
    }
    
    float h = hash(cell + uSeed);
    if (h < 0.25) { gl_FragColor = vec4(uColor, 1.0); return; } // empty block
    
    float dist = length(cellUv - vec2(0.5));
    bool isSym = h < 0.5 ? (dist < 0.25) : h < 0.8 ? (abs(cellUv.x-0.5)<0.2 && abs(cellUv.y-0.5)<0.2) : (abs(cellUv.x+cellUv.y-1.0)<0.2);
    
    gl_FragColor = vec4(isSym ? uColor * 0.15 : uColor, 1.0);
  }
`;

function SignBoard({ w, d, h, side, heightFactor, yOffset, color, seed }: {
  w: number; d: number; h: number; side: number; heightFactor: number; yOffset: number; color: string; seed: number;
}) {
  const sbW = 0.6 + heightFactor * 0.8; // big, wide boards
  const sbH = h * heightFactor;
  const sbD = 0.04;
  
  const maxY = h - sbH;
  let pos: [number, number, number] = [0, sbH / 2 + maxY * yOffset, 0];
  let rot = 0;
  
  // Attach to edge of building face
  if (side === 0) { pos = [w/2 - sbW/2 - 0.02, pos[1], d/2 + sbD/2]; rot = 0; }
  else if (side === 1) { pos = [-w/2 + sbW/2 + 0.02, pos[1], -d/2 - sbD/2]; rot = Math.PI; }
  else if (side === 2) { pos = [-w/2 - sbD/2, pos[1], d/2 - sbW/2 - 0.02]; rot = -Math.PI / 2; }
  else { pos = [w/2 + sbD/2, pos[1], -d/2 + sbW/2 + 0.02]; rot = Math.PI / 2; }

  const geom = useMemo(() => new THREE.BoxGeometry(sbW, sbH, sbD), [sbW, sbH, sbD]);
  const uniforms = useMemo(() => {
    const c = new THREE.Color(color);
    return { uColor: { value: new THREE.Vector3(c.r, c.g, c.b) }, uSeed: { value: seed } };
  }, [color, seed]);
  
  return (
    <mesh position={pos} rotation={[0, rot, 0]} geometry={geom}>
      <shaderMaterial vertexShader={signBoardVert} fragmentShader={signBoardFrag} uniforms={uniforms} toneMapped={false} />
    </mesh>
  );
}

// ── Single crown layer (stepped ring for tower top) ───────────────────────────
function CrownLayer({ w, d, yOff, color, body }: {
  w: number; d: number; yOff: number; color: string; body: string;
}) {
  const H = 0.82;
  const geom  = useMemo(() => new THREE.BoxGeometry(w, H, d),  [w, d]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geom),   [geom]);
  return (
    <group position={[0, yOff, 0]}>
      <mesh geometry={geom}><meshBasicMaterial color={body} /></mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={color} toneMapped={false} transparent opacity={0.80} />
      </lineSegments>
      {/* Neon ring on top of each layer */}
      <NeonBand w={w + 0.05} d={d + 0.05} y={H / 2} color={color} opacity={0.95} />
    </group>
  );
}

// ── Layered tower crown (3–5 stepped rings that narrow toward the top) ────────
function LayeredCrown({ baseW, baseD, body, color, layers, startY }: {
  baseW: number; baseD: number; body: string; color: string; layers: number; startY: number;
}) {
  const LAYER_H = 0.82;
  const SHRINK  = 0.12; // each layer 12 % narrower
  return (
    <group position={[0, startY, 0]}>
      {Array.from({ length: layers }, (_, i) => (
        <CrownLayer
          key={i}
          w={baseW * (1 - i * SHRINK)}
          d={baseD * (1 - i * SHRINK)}
          yOff={i * LAYER_H}
          color={color}
          body={body}
        />
      ))}
    </group>
  );
}

// ── Main building ─────────────────────────────────────────────────────────────
function BuildingComponent({ data, onClick }: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const rand = makeRandom(data.id);

  const style = useMemo(() => {
    const r1 = rand(); const r2 = rand(); const r3 = rand();
    const r4 = rand(); const r5 = rand();
    const archetype  = Math.floor(r1 * 5);
    const hasAntenna = archetype === 4 || (data.height > 5 && r2 > 0.28);
    const antennaH   = 2.0 + r3 * 3.5;
    // Crown: tall buildings (height > 7) get 3-5 layered steps instead of a plain setback
    const hasCrown   = data.height > 7 && (archetype === 0 || archetype === 3 || archetype === 1);
    const crownLayers = hasCrown ? (3 + Math.floor(r4 * 3)) : 0; // 3-5 layers
    const hasSetback = !hasCrown && (archetype === 1 || (archetype === 0 && r4 > 0.6));
    const setbackR   = 0.52 + r2 * 0.18;
    const narrowR    = 0.54 + r3 * 0.22;
    const bandCount  = archetype === 0 ? Math.floor(4 + r4 * 6)
                     : archetype === 3 ? Math.floor(2 + r5 * 4) : 0;
    const vCount     = archetype === 2 ? (2 + Math.floor(r4 * 3)) : 0;
    
    // Sign boards
    const signBoards = [];
    if (archetype !== 0 && archetype !== 4) { // Not on glass towers or spires
       const boardCount = Math.floor(r2 * 5); // 0 to 4 boards per building
       const boardPalette = ["#ff0055", "#00ffff", "#ffff00", "#ff00ff", "#00ff66"];
       for (let i = 0; i < boardCount; i++) {
          signBoards.push({
             id: i,
             side: Math.floor(rand() * 4), // 0-3
             lenFactor: 0.15 + rand() * 0.75, // 15% to 90% of base height (small to large)
             yOffset: rand(), // 0.0 to 1.0
             color: boardPalette[Math.floor(rand() * boardPalette.length)]
          });
       }
    }
    
    return { archetype, hasAntenna, antennaH, hasCrown, crownLayers, hasSetback, setbackR, narrowR, bandCount, vCount, signBoards };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  // Sizes
  const baseH = style.hasSetback ? data.height * style.setbackR : data.height;
  const topH  = style.hasSetback ? data.height * (1 - style.setbackR) : 0;
  const topW  = data.width * style.narrowR;
  const topD  = data.depth * style.narrowR;

  // Geometry
  const baseGeom  = useMemo(() => new THREE.BoxGeometry(data.width, baseH, data.depth), [data.width, baseH, data.depth]);
  const baseEdges = useMemo(() => new THREE.EdgesGeometry(baseGeom),                    [baseGeom]);
  const topGeom   = useMemo(() => style.hasSetback ? new THREE.BoxGeometry(topW, topH, topD) : null, [topW, topH, topD, style.hasSetback]);
  const topEdges  = useMemo(() => topGeom ? new THREE.EdgesGeometry(topGeom) : null,   [topGeom]);

  // Shader uniforms
  const neonVec = useMemo(() => { const c = new THREE.Color(data.emissiveColor); return new THREE.Vector3(c.r, c.g, c.b); }, [data.emissiveColor]);
  const bodyVec = useMemo(() => { const hex = tintedBody(data.emissiveColor); const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); }, [data.emissiveColor]);
  const seedVal = useMemo(() => { let s = 0; for (let i = 0; i < data.id.length; i++) s += data.id.charCodeAt(i); return (s % 997) + 1; }, [data.id]);

  const baseUniforms = useMemo(() => ({
    uNeon: { value: neonVec }, uSeed: { value: seedVal },
    uWidth: { value: data.width }, uHeight: { value: baseH }, uDepth: { value: data.depth }, uBody: { value: bodyVec },
    uTime: { value: 0 },
    uHover: { value: 0 }
  }), [neonVec, seedVal, data.width, baseH, data.depth, bodyVec]);

  const topUniforms = useMemo(() => ({
    uNeon: { value: neonVec }, uSeed: { value: seedVal + 31 },
    uWidth: { value: topW }, uHeight: { value: topH }, uDepth: { value: topD }, uBody: { value: bodyVec },
    uTime: { value: 0 },
    uHover: { value: 0 }
  }), [neonVec, seedVal, topW, topH, topD, bodyVec]);
  
  useFrame(({ clock }) => {
    baseUniforms.uTime.value = clock.elapsedTime;
    if (topUniforms) topUniforms.uTime.value = clock.elapsedTime;
  });

  React.useEffect(() => {
    baseUniforms.uHover.value = hovered ? 1.0 : 0.0;
    if (topUniforms) topUniforms.uHover.value = hovered ? 1.0 : 0.0;
  }, [hovered, baseUniforms, topUniforms]);

  const bodyHex     = useMemo(() => tintedBody(data.emissiveColor), [data.emissiveColor]);
  const edgeColor   = hovered ? "#ffffff" : data.emissiveColor;
  const edgeOpacity = hovered ? 1.0 : 0.80;

  const stripPalette: Record<number, string> = { 
    0: "#00ffff", 
    1: "#ff00ff", 
    2: ["#ff2288", "#00e5ff", "#aa00ff"][seedVal % 3], // pink, cyan, or purple
    3: "#ffff00", 
    4: "#cc00ff" 
  };
  const stripColor = hovered ? "#ffffff" : (stripPalette[style.archetype] ?? data.emissiveColor);

  const bands = useMemo(() => {
    if (style.bandCount === 0) return [];
    const gap = baseH / (style.bandCount + 1);
    return Array.from({ length: style.bandCount }, (_, i) => gap * (i + 1) - baseH / 2);
  }, [baseH, style.bandCount]);

  const vStripXs = useMemo(() => {
    if (style.vCount === 0) return [];
    const gap = data.width / (style.vCount + 1);
    return Array.from({ length: style.vCount }, (_, i) => -data.width / 2 + gap * (i + 1));
  }, [data.width, style.vCount]);

  return (
    <group
      position={[data.x, 0.3, data.z]}
      onClick={(e) => { e.stopPropagation(); onClick(data); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* ── Base section with variable sparse windows ── */}
      <group position={[0, baseH / 2, 0]}>
        <mesh geometry={baseGeom} frustumCulled>
          <shaderMaterial vertexShader={sparseWinVert} fragmentShader={sparseWinFrag} uniforms={baseUniforms} toneMapped={false} />
        </mesh>
        <lineSegments geometry={baseEdges} frustumCulled>
          <lineBasicMaterial color={edgeColor} toneMapped={false} transparent opacity={edgeOpacity} />
        </lineSegments>
        {bands.map((y, i) => (
          <NeonBand key={i} w={data.width + 0.05} d={data.depth + 0.05} y={y} color={stripColor}
            opacity={style.archetype === 3 ? 0.95 : 0.78} />
        ))}
        {vStripXs.map((x, i) => (
          <VStrip key={i} x={x} z={data.depth / 2 + 0.02} rot={0} height={baseH} color={stripColor} />
        ))}
        {style.signBoards.map((b) => (
          <SignBoard key={b.id} w={data.width} d={data.depth} h={baseH} side={b.side} heightFactor={b.lenFactor} yOffset={b.yOffset} color={b.color} seed={seedVal + b.id * 10} />
        ))}
      </group>

      {/* ── Layered crown (replaces plain setback for tall towers) ── */}
      {style.hasCrown && (
        <LayeredCrown
          baseW={data.width}
          baseD={data.depth}
          body={bodyHex}
          color={data.emissiveColor}
          layers={style.crownLayers}
          startY={baseH}
        />
      )}

      {/* ── Plain stepped setback for shorter buildings ── */}
      {style.hasSetback && topGeom && topEdges && (
        <group position={[0, baseH + topH / 2, 0]}>
          <mesh geometry={topGeom} frustumCulled>
            <shaderMaterial vertexShader={sparseWinVert} fragmentShader={sparseWinFrag} uniforms={topUniforms} toneMapped={false} />
          </mesh>
          <lineSegments geometry={topEdges} frustumCulled>
            <lineBasicMaterial color={edgeColor} toneMapped={false} transparent opacity={edgeOpacity} />
          </lineSegments>
          <NeonBand w={topW + 0.05} d={topD + 0.05} y={-topH / 2} color={stripColor} opacity={0.95} />
          <NeonBand w={topW + 0.05} d={topD + 0.05} y={ topH / 2} color={stripColor} opacity={0.95} />
        </group>
      )}

      {/* ── Base glow band ── */}
      <NeonBand w={data.width + 0.08} d={data.depth + 0.08} y={0.28}
        color={data.emissiveColor} opacity={hovered ? 1.0 : 0.55} />

      {/* ── Rooftop crown ring ── */}
      <NeonBand w={data.width + 0.04} d={data.depth + 0.04} y={baseH}
        color={data.emissiveColor} opacity={hovered ? 1.0 : 0.60} />

      {/* ── Antenna spire with blurred glow halos ── */}
      {style.hasAntenna && (
        <group position={[0, data.height + (style.hasCrown ? style.crownLayers * 0.82 : 0), 0]}>
          {/* Thin pole */}
          <mesh position={[0, style.antennaH / 2, 0]}>
            <cylinderGeometry args={[0.018, 0.018, style.antennaH, 4]} />
            <meshBasicMaterial color={edgeColor} toneMapped={false} />
          </mesh>
          {/* Light column shooting upward */}
          <mesh position={[0, style.antennaH + 2.2, 0]}>
            <cylinderGeometry args={[0.006, 0.042, 4.5, 4]} />
            <meshBasicMaterial color={edgeColor} toneMapped={false} transparent opacity={0.25} />
          </mesh>

          {/* ── Blurred glow halos around beacon ── */}
          {/* Outer soft halo — largest, very transparent */}
          <mesh position={[0, style.antennaH, 0]}>
            <sphereGeometry args={[2.2, 8, 8]} />
            <meshBasicMaterial color={data.emissiveColor} toneMapped={false} transparent opacity={0.028}
              blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* Mid halo */}
          <mesh position={[0, style.antennaH, 0]}>
            <sphereGeometry args={[1.1, 8, 8]} />
            <meshBasicMaterial color={data.emissiveColor} toneMapped={false} transparent opacity={0.055}
              blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* Inner halo */}
          <mesh position={[0, style.antennaH, 0]}>
            <sphereGeometry args={[0.45, 8, 8]} />
            <meshBasicMaterial color={data.emissiveColor} toneMapped={false} transparent opacity={0.13}
              blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* Bright core beacon (pulsing) */}
          <Beacon color={data.emissiveColor} y={style.antennaH} />
        </group>
      )}
    </group>
  );
}

export default React.memo(BuildingComponent, (prev, next) => prev.data.id === next.data.id);
