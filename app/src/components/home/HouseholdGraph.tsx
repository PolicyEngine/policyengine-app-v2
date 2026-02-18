import { useCallback, useEffect, useMemo, useRef } from 'react';
import { colors } from '@/designTokens';

const NODE_COUNT = 800;
const NODE_MIN_SIZE = 3;
const NODE_MAX_SIZE = 7;
const HOVER_RADIUS = 110;

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

interface Node {
  id: number;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  driftDuration: number;
  driftDelay: number;
  driftVariant: number;
}

export interface NodeImpact {
  polarity: 'positive' | 'negative' | 'neutral';
  magnitude: number;
}

export type ImpactState = Map<number, NodeImpact>;

/**
 * Generate clustered impact patterns that respect the specified
 * winner/loser distribution for each prompt.
 */
export function generateImpactForPrompt(
  promptIndex: number,
  nodes: { id: number; x: number; y: number }[],
  winnerPct: number,
  loserPct: number
): ImpactState {
  const impact: ImpactState = new Map();
  const totalAffected = winnerPct + loserPct;

  if (totalAffected === 0) {
    for (const node of nodes) {
      impact.set(node.id, { polarity: 'neutral', magnitude: 0 });
    }
    return impact;
  }

  const winnerShare = winnerPct / totalAffected;
  const numClusters = 3 + Math.floor(seededRandom(promptIndex * 13) * 3);
  const numWinnerClusters = Math.max(winnerPct > 0 ? 1 : 0, Math.round(numClusters * winnerShare));
  const numLoserClusters = Math.max(loserPct > 0 ? 1 : 0, numClusters - numWinnerClusters);
  const baseRadius = 0.08 + totalAffected * 0.18;

  const clusters: {
    cx: number;
    cy: number;
    radius: number;
    polarity: 'positive' | 'negative';
  }[] = [];

  for (let c = 0; c < numWinnerClusters + numLoserClusters; c++) {
    const seed = promptIndex * 100 + c;
    const polarity: 'positive' | 'negative' = c < numWinnerClusters ? 'positive' : 'negative';
    clusters.push({
      cx: 0.1 + seededRandom(seed) * 0.8,
      cy: 0.1 + seededRandom(seed + 1) * 0.8,
      radius: baseRadius + seededRandom(seed + 2) * 0.08,
      polarity,
    });
  }

  const targetWinners = Math.round(nodes.length * winnerPct);
  const targetLosers = Math.round(nodes.length * loserPct);
  let winnerCount = 0;
  let loserCount = 0;

  for (const node of nodes) {
    let assigned = false;
    for (const cluster of clusters) {
      if (cluster.polarity === 'positive' && winnerCount >= targetWinners) {
        continue;
      }
      if (cluster.polarity === 'negative' && loserCount >= targetLosers) {
        continue;
      }

      const dx = node.x - cluster.cx;
      const dy = node.y - cluster.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < cluster.radius) {
        const falloff = 1 - dist / cluster.radius;
        if (seededRandom(promptIndex * 1000 + node.id) < falloff * 0.85 + 0.15) {
          impact.set(node.id, { polarity: cluster.polarity, magnitude: falloff });
          if (cluster.polarity === 'positive') {
            winnerCount++;
          } else {
            loserCount++;
          }
          assigned = true;
          break;
        }
      }
    }
    if (!assigned) {
      impact.set(node.id, { polarity: 'neutral', magnitude: 0 });
    }
  }

  return impact;
}

export function generateGraph(): Node[] {
  const nodes: Node[] = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    const seed = i * 7 + 42;
    const cols = Math.ceil(Math.sqrt(NODE_COUNT * 1.6));
    const rows = Math.ceil(NODE_COUNT / cols);
    const gridX = (i % cols) / cols;
    const gridY = Math.floor(i / cols) / rows;
    const jitterX = (seededRandom(seed) - 0.5) * (1 / cols) * 1.4;
    const jitterY = (seededRandom(seed + 1) - 0.5) * (1 / rows) * 1.4;

    nodes.push({
      id: i,
      x: Math.max(0.01, Math.min(0.99, gridX + jitterX)),
      y: Math.max(0.01, Math.min(0.99, gridY + jitterY)),
      size: NODE_MIN_SIZE + seededRandom(seed + 2) * (NODE_MAX_SIZE - NODE_MIN_SIZE),
      baseOpacity: 0.15 + seededRandom(seed + 3) * 0.15,
      driftDuration: 10 + seededRandom(seed + 4) * 14,
      driftDelay: seededRandom(seed + 5) * -20,
      driftVariant: Math.floor(seededRandom(seed + 6) * 4),
    });
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

function getDrift(variant: number, t: number): [number, number] {
  const kf = DRIFT_KEYFRAMES[variant];
  const n = kf.length;
  const scaled = (((t % 1) + 1) % 1) * n; // ensure positive
  const i = Math.floor(scaled) % n;
  const frac = scaled - Math.floor(scaled);
  const next = (i + 1) % n;
  // Cosine ease between waypoints
  const ease = (1 - Math.cos(frac * Math.PI)) * 0.5;
  return [kf[i][0] + (kf[next][0] - kf[i][0]) * ease, kf[i][1] + (kf[next][1] - kf[i][1]) * ease];
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
const COLOR_PRIMARY_500: [number, number, number] = parseHex(colors.primary[500]);
const COLOR_PRIMARY_400: [number, number, number] = parseHex(colors.primary[400]);
const COLOR_SUCCESS: [number, number, number] = parseHex(colors.success);
const COLOR_ERROR: [number, number, number] = parseHex(colors.error);

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
  if (impact !== prevImpactIdentityRef.current) {
    prevImpactIdentityRef.current = impact;
    impactRef.current = impact;
    impactChangeTimeRef.current = performance.now();
  }

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
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    let raf = 0;
    let lastFrame = performance.now();
    const startTime = performance.now();

    // Resize handler with DPR support
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const animate = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
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
        // easeOutBack with moderate overshoot
        const c1 = 2.2;
        const c3 = c1 + 1;
        const popScale = popT >= 1 ? 1 : 1 + c3 * (popT - 1) ** 3 + c1 * (popT - 1) ** 2;

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
        let tSize = node.size;
        let useFastLerp = false;

        // Impact colouring (with radial wave delay)
        if (currentImpact && impactAge >= state.waveDelay) {
          const info = currentImpact.get(node.id);
          if (info?.polarity === 'positive') {
            [tr, tg, tb] = COLOR_SUCCESS;
            tOpacity = 0.5 + info.magnitude * 0.4;
            tSize = node.size * (1 + info.magnitude * 0.8);
          } else if (info?.polarity === 'negative') {
            [tr, tg, tb] = COLOR_ERROR;
            tOpacity = 0.5 + info.magnitude * 0.4;
            tSize = node.size * (1 + info.magnitude * 0.8);
          }
        }

        // Mouse proximity (overrides impact colours for nearby nodes)
        if (mouse) {
          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < HOVER_RADIUS) {
            const prox = 1 - dist / HOVER_RADIUS;
            if (prox > 0.7) {
              [tr, tg, tb] = COLOR_PRIMARY_500;
            } else {
              [tr, tg, tb] = COLOR_PRIMARY_400;
            }
            tOpacity = node.baseOpacity + prox * 0.5;
            tSize = node.size * (1 + prox * 0.8);
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
        ctx.roundRect(px - half, py - half, size, size, 1.5);
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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'all',
      }}
    />
  );
}
