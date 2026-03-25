"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { colors } from "@policyengine/design-system/tokens";
import { UK_CENTERS, US_CENTERS } from "./populationCenters";

const NODE_COUNT = 10000;
const NODE_SIZE = 1.5;
const HOVER_RADIUS = 110;
const HOVER_RADIUS_SQ = HOVER_RADIUS * HOVER_RADIUS;
const TWO_PI = Math.PI * 2;
const EASE_C1 = 2.2;
const EASE_C3 = EASE_C1 + 1;

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

interface Node {
  id: number;
  x: number;
  y: number;
  baseOpacity: number;
  baseSize: number;
  driftDuration: number;
  driftDelay: number;
  driftVariant: number;
}

export interface NodeImpact {
  polarity: "positive" | "negative" | "neutral";
  magnitude: number;
}

export type ImpactState = Map<number, NodeImpact>;

/**
 * Assign winner/loser/neutral impact with mostly-uniform distribution
 * plus a soft spatial bias so each prompt has a distinct visual pattern.
 * Cluster centres are random (not geographic) to avoid implying location.
 */
export function generateImpactForPrompt(
  promptIndex: number,
  nodes: { id: number; x: number; y: number }[],
  winnerPct: number,
  loserPct: number,
): ImpactState {
  const impact: ImpactState = new Map();
  const totalAffected = winnerPct + loserPct;

  if (totalAffected === 0) {
    for (const node of nodes) {
      impact.set(node.id, { polarity: "neutral", magnitude: 0 });
    }
    return impact;
  }

  // 2-3 random cluster centres per prompt for soft spatial bias
  const numClusters = 2 + Math.floor(seededRandom(promptIndex * 13) * 2);
  const winnerShare = winnerPct / totalAffected;
  const numWinnerClusters = Math.max(
    winnerPct > 0 ? 1 : 0,
    Math.round(numClusters * winnerShare),
  );

  const clusters: {
    cx: number;
    cy: number;
    polarity: "positive" | "negative";
  }[] = [];
  for (let c = 0; c < numClusters; c++) {
    const seed = promptIndex * 100 + c;
    clusters.push({
      cx: 0.1 + seededRandom(seed) * 0.8,
      cy: 0.1 + seededRandom(seed + 1) * 0.8,
      polarity: c < numWinnerClusters ? "positive" : "negative",
    });
  }

  // Score: 70% random + 30% spatial proximity to nearest cluster
  const scored = nodes.map((node) => {
    let minPosDist = Infinity;
    let minNegDist = Infinity;
    for (const cl of clusters) {
      const dx = node.x - cl.cx;
      const dy = node.y - cl.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (cl.polarity === "positive") {
        minPosDist = Math.min(minPosDist, dist);
      } else {
        minNegDist = Math.min(minNegDist, dist);
      }
    }
    const noise = seededRandom(promptIndex * 1000 + node.id) * 0.7;
    return {
      id: node.id,
      posScore: minPosDist * 0.3 + noise,
      negScore: minNegDist * 0.3 + noise,
    };
  });

  const targetWinners = Math.round(nodes.length * winnerPct);
  const targetLosers = Math.round(nodes.length * loserPct);

  if (targetWinners > 0) {
    const byPos = [...scored].sort((a, b) => a.posScore - b.posScore);
    for (let i = 0; i < targetWinners && i < byPos.length; i++) {
      impact.set(byPos[i].id, {
        polarity: "positive",
        magnitude: 0.7 + seededRandom(byPos[i].id * 3 + promptIndex) * 0.3,
      });
    }
  }

  if (targetLosers > 0) {
    const byNeg = [...scored]
      .filter((s) => !impact.has(s.id))
      .sort((a, b) => a.negScore - b.negScore);
    for (let i = 0; i < targetLosers && i < byNeg.length; i++) {
      impact.set(byNeg[i].id, {
        polarity: "negative",
        magnitude: 0.7 + seededRandom(byNeg[i].id * 3 + promptIndex + 1) * 0.3,
      });
    }
  }

  for (const node of nodes) {
    if (!impact.has(node.id)) {
      impact.set(node.id, { polarity: "neutral", magnitude: 0 });
    }
  }

  return impact;
}

// Box-Muller transform for gaussian jitter (seeded)
function gaussianJitter(seed: number, sigma: number): number {
  const u1 = Math.max(1e-10, seededRandom(seed));
  const u2 = seededRandom(seed + 1);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
}

function createNode(
  nodeId: number,
  cx: number,
  cy: number,
  sigma: number,
): Node {
  const seed = nodeId * 7 + 42;
  return {
    id: nodeId,
    x: Math.max(0.01, Math.min(0.99, cx + gaussianJitter(seed, sigma))),
    y: Math.max(0.01, Math.min(0.99, cy + gaussianJitter(seed + 2, sigma))),
    baseOpacity: 0.08,
    baseSize: NODE_SIZE * (0.2 + seededRandom(seed + 9) * 1.8),
    driftDuration: 10 + seededRandom(seed + 6) * 14,
    driftDelay: seededRandom(seed + 7) * -20,
    driftVariant: Math.floor(seededRandom(seed + 8) * 4),
  };
}

export function generateGraph(countryId: string = "us"): Node[] {
  const centers = countryId === "uk" ? UK_CENTERS : US_CENTERS;
  const totalWeight = centers.reduce((sum, c) => sum + c[2], 0);
  const nodes: Node[] = [];

  // Distribute NODE_COUNT dots proportionally across population centers
  let nodeId = 0;
  for (const [cx, cy, weight] of centers) {
    const count = Math.round((weight / totalWeight) * NODE_COUNT);
    // Jitter radius scales with weight (bigger cities spread more)
    const sigma = 0.008 + (weight / totalWeight) * 0.04;
    for (let j = 0; j < count && nodeId < NODE_COUNT; j++) {
      nodes.push(createNode(nodeId, cx, cy, sigma));
      nodeId++;
    }
  }

  // Fill remaining dots (rounding leftovers) near random centers
  while (nodeId < NODE_COUNT) {
    const ci = Math.floor(seededRandom(nodeId * 7 + 42 + 99) * centers.length);
    const [cx, cy] = centers[ci];
    nodes.push(createNode(nodeId, cx, cy, 0.03));
    nodeId++;
  }

  return nodes;
}

// --- Canvas renderer ---

// Drift keyframe waypoints matching the original CSS animations
const DRIFT_KEYFRAMES: [number, number][][] = [
  [
    [0, 0],
    [3, -2],
    [-1, 3],
    [-3, -1],
  ],
  [
    [0, 0],
    [-2, 3],
    [3, 1],
    [1, -3],
  ],
  [
    [0, 0],
    [2, 2],
    [-3, -1],
    [1, -2],
  ],
  [
    [0, 0],
    [-1, -3],
    [2, -1],
    [-2, 2],
  ],
];

// Reusable buffer to avoid allocating a new array every frame per node
const _driftOut: [number, number] = [0, 0];

function getDrift(variant: number, t: number): [number, number] {
  const kf = DRIFT_KEYFRAMES[variant];
  const n = kf.length;
  const scaled = (((t % 1) + 1) % 1) * n; // ensure positive
  const i = Math.floor(scaled) % n;
  const frac = scaled - Math.floor(scaled);
  const next = (i + 1) % n;
  // Cosine ease between waypoints
  const ease = (1 - Math.cos(frac * Math.PI)) * 0.5;
  _driftOut[0] = kf[i][0] + (kf[next][0] - kf[i][0]) * ease;
  _driftOut[1] = kf[i][1] + (kf[next][1] - kf[i][1]) * ease;
  return _driftOut;
}

function parseHex(hex: string): [number, number, number] {
  if (hex.length === 4) {
    return [
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
      parseInt(hex[3] + hex[3], 16),
    ];
  }
  return [
    parseInt(hex.substring(1, 3), 16),
    parseInt(hex.substring(3, 5), 16),
    parseInt(hex.substring(5, 7), 16),
  ];
}

// Precomputed colour RGB tuples
const COLOR_GRAY: [number, number, number] = parseHex(colors.gray[300]);
const COLOR_PRIMARY: [number, number, number] = parseHex(colors.primary[500]);
const COLOR_PRIMARY_400: [number, number, number] = parseHex(
  colors.primary[400],
);
const COLOR_NEGATIVE: [number, number, number] = parseHex(colors.gray[600]);

// Per-node mutable animation state (lives outside React)
interface AnimState {
  r: number;
  g: number;
  b: number;
  opacity: number;
  size: number;
  // Wave delay for impact transitions (ms from centre)
  waveDelay: number;
}

interface HouseholdGraphProps {
  nodes: Node[];
  impact: ImpactState | null;
}

export default function HouseholdGraph({ nodes, impact }: HouseholdGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const impactRef = useRef<ImpactState | null>(null);
  const impactChangeTimeRef = useRef(0);
  const prevImpactIdentityRef = useRef<ImpactState | null>(null);

  // Update impact ref; track when it changes for wave timing
  useEffect(() => {
    prevImpactIdentityRef.current = impact;
    impactRef.current = impact;
    impactChangeTimeRef.current = performance.now();
  }, [impact]);

  // Build per-node animation state once and precompute wave delays
  const animStates = useMemo(() => {
    return nodes.map((node): AnimState => {
      const dx = node.x - 0.5;
      const dy = node.y - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return {
        r: COLOR_GRAY[0],
        g: COLOR_GRAY[1],
        b: COLOR_GRAY[2],
        opacity: 0, // start invisible for pop-in
        size: 0,
        waveDelay: (dist / 0.7) * 600, // 0-600ms radial wave
      };
    });
  }, [nodes]);

  // Pop-in start times (radial from centre)
  const popStartTimes = useMemo(() => {
    const base = performance.now();
    return nodes.map((node) => {
      const dx = node.x - 0.5;
      const dy = node.y - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return base + (dist / 0.7) * 800;
    });
  }, [nodes]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let raf = 0;
    let lastFrame = performance.now();
    const startTime = performance.now();
    let cachedW = 0;
    let cachedH = 0;

    // Resize handler with DPR support; caches dimensions to avoid layout reads per frame
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      cachedW = rect.width;
      cachedH = rect.height;
      canvas.width = cachedW * dpr;
      canvas.height = cachedH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const animate = (now: number) => {
      const w = cachedW;
      const h = cachedH;
      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Frame-rate independent lerp factor
      const dt = Math.min((now - lastFrame) / 16.667, 4);
      lastFrame = now;
      const lerpFast = 1 - 0.82 ** dt; // ~0.18 per frame, mouse hover
      const lerpMedium = 1 - 0.92 ** dt; // ~0.08 per frame, impact colours

      const elapsed = (now - startTime) / 1000;
      const mouse = mouseRef.current;
      const currentImpact = impactRef.current;
      const impactAge = now - impactChangeTimeRef.current;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const state = animStates[i];

        // Pop-in: easeOutBack timing
        const popElapsed = now - popStartTimes[i];
        if (popElapsed <= 0) {
          continue;
        }
        const popT = Math.min(popElapsed / 500, 1);
        const popScale =
          popT >= 1
            ? 1
            : 1 + EASE_C3 * (popT - 1) ** 3 + EASE_C1 * (popT - 1) ** 2;

        // Drift
        const driftT = (elapsed - node.driftDelay) / node.driftDuration;
        const [driftX, driftY] = getDrift(node.driftVariant, driftT);

        const px = node.x * w + driftX;
        const py = node.y * h + driftY;

        // Determine target colour, opacity, and size
        let tr = COLOR_GRAY[0];
        let tg = COLOR_GRAY[1];
        let tb = COLOR_GRAY[2];
        let tOpacity = node.baseOpacity;
        let tSize = node.baseSize;
        let useFastLerp = false;

        // Impact colouring (with radial wave delay)
        if (currentImpact && impactAge >= state.waveDelay) {
          const info = currentImpact.get(node.id);
          if (info && info.polarity !== "neutral") {
            [tr, tg, tb] =
              info.polarity === "positive" ? COLOR_PRIMARY : COLOR_NEGATIVE;
            tOpacity = 0.15 + info.magnitude * 0.1;
            tSize = NODE_SIZE * (1 + info.magnitude * 0.8);
          }
        }

        // Mouse proximity (overrides impact colours for nearby nodes)
        if (mouse) {
          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < HOVER_RADIUS_SQ) {
            const dist = Math.sqrt(distSq);
            const prox = 1 - dist / HOVER_RADIUS;
            if (prox > 0.7) {
              [tr, tg, tb] = COLOR_PRIMARY;
            } else {
              [tr, tg, tb] = COLOR_PRIMARY_400;
            }
            tOpacity = node.baseOpacity + prox * 0.5;
            tSize = NODE_SIZE * (1 + prox * 0.8);
            useFastLerp = true;
          }
        }

        // Lerp current values toward targets
        const lf = useFastLerp ? lerpFast : lerpMedium;
        state.r += (tr - state.r) * lf;
        state.g += (tg - state.g) * lf;
        state.b += (tb - state.b) * lf;
        state.opacity += (tOpacity - state.opacity) * lf;
        state.size += (tSize - state.size) * lf;

        // Draw
        const size = state.size * popScale;
        if (size < 0.5) {
          continue;
        } // skip sub-pixel nodes
        const half = size * 0.5;
        const alpha = state.opacity * Math.min(popScale, 1);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${state.r | 0},${state.g | 0},${state.b | 0})`;
        ctx.beginPath();
        ctx.arc(px, py, half, 0, TWO_PI);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [nodes, animStates, popStartTimes]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "all",
      }}
    />
  );
}
