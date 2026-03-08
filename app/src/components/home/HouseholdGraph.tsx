import { useCallback, useEffect, useMemo, useRef } from 'react';
import { colors } from '@/designTokens';

const NODE_COUNT = 3200;
const NODE_SIZE = 4;
const HOVER_RADIUS = 110;

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

interface Node {
  id: number;
  x: number;
  y: number;
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
 * Assign winner/loser/neutral impact with mostly-uniform distribution
 * plus a soft spatial bias so each prompt has a distinct visual pattern.
 * Cluster centres are random (not geographic) to avoid implying location.
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

  // 2-3 random cluster centres per prompt for soft spatial bias
  const numClusters = 2 + Math.floor(seededRandom(promptIndex * 13) * 2);
  const winnerShare = winnerPct / totalAffected;
  const numWinnerClusters = Math.max(winnerPct > 0 ? 1 : 0, Math.round(numClusters * winnerShare));

  const clusters: { cx: number; cy: number; polarity: 'positive' | 'negative' }[] = [];
  for (let c = 0; c < numClusters; c++) {
    const seed = promptIndex * 100 + c;
    clusters.push({
      cx: 0.1 + seededRandom(seed) * 0.8,
      cy: 0.1 + seededRandom(seed + 1) * 0.8,
      polarity: c < numWinnerClusters ? 'positive' : 'negative',
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
      if (cl.polarity === 'positive') {
        minPosDist = Math.min(minPosDist, dist);
      } else {
        minNegDist = Math.min(minNegDist, dist);
      }
    }
    const noise = seededRandom(promptIndex * 1000 + node.id) * 0.7;
    return { id: node.id, posScore: minPosDist * 0.3 + noise, negScore: minNegDist * 0.3 + noise };
  });

  const targetWinners = Math.round(nodes.length * winnerPct);
  const targetLosers = Math.round(nodes.length * loserPct);

  if (targetWinners > 0) {
    const byPos = [...scored].sort((a, b) => a.posScore - b.posScore);
    for (let i = 0; i < targetWinners && i < byPos.length; i++) {
      impact.set(byPos[i].id, {
        polarity: 'positive',
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
        polarity: 'negative',
        magnitude: 0.7 + seededRandom(byNeg[i].id * 3 + promptIndex + 1) * 0.3,
      });
    }
  }

  for (const node of nodes) {
    if (!impact.has(node.id)) {
      impact.set(node.id, { polarity: 'neutral', magnitude: 0 });
    }
  }

  return impact;
}

// Population centers: [x, y, weight] in normalized 0-1 space
// US: continental US mapped to landscape-oriented rectangle
// Coordinates approximate major metro areas; weight ≈ relative population
const US_CENTERS: [number, number, number][] = [
  // Northeast corridor
  [0.88, 0.28, 8.3], // NYC
  [0.85, 0.32, 4.0], // Philadelphia
  [0.92, 0.25, 2.8], // Boston
  [0.87, 0.35, 2.5], // Baltimore/DC
  [0.84, 0.28, 1.2], // Hartford/CT
  // Southeast
  [0.82, 0.52, 3.5], // Atlanta
  [0.87, 0.55, 3.0], // Charlotte/Raleigh
  [0.82, 0.62, 2.8], // Miami/S Florida
  [0.78, 0.62, 2.2], // Tampa/Orlando
  [0.73, 0.58, 1.5], // Nashville
  [0.85, 0.47, 1.0], // Virginia Beach
  // Midwest
  [0.68, 0.3, 4.7], // Chicago
  [0.72, 0.32, 2.5], // Detroit
  [0.66, 0.35, 1.8], // Indianapolis/Columbus
  [0.62, 0.3, 1.6], // Minneapolis
  [0.58, 0.35, 1.5], // Kansas City/St Louis
  [0.72, 0.28, 1.2], // Cleveland/Pittsburgh
  [0.62, 0.34, 0.8], // Milwaukee
  // Texas
  [0.52, 0.65, 3.8], // Dallas/Fort Worth
  [0.5, 0.72, 3.5], // Houston
  [0.46, 0.68, 1.5], // San Antonio/Austin
  // Mountain/West
  [0.32, 0.42, 1.8], // Denver
  [0.22, 0.48, 1.5], // Phoenix
  [0.17, 0.42, 1.2], // Las Vegas
  [0.28, 0.35, 0.8], // Salt Lake City
  // Pacific
  [0.1, 0.55, 6.5], // LA/SoCal
  [0.08, 0.38, 4.0], // SF Bay Area
  [0.1, 0.48, 1.5], // San Diego
  [0.08, 0.22, 2.0], // Seattle
  [0.08, 0.28, 1.2], // Portland
  [0.05, 0.15, 0.5], // Spokane/rural WA
];

// UK: oriented vertically (taller than wide)
const UK_CENTERS: [number, number, number][] = [
  // London & Southeast
  [0.62, 0.78, 14.0], // London (metro ~14m of ~67m)
  [0.55, 0.82, 1.5], // Southampton/Portsmouth
  [0.68, 0.76, 1.0], // Canterbury/Kent
  [0.58, 0.74, 0.8], // Reading/Surrey
  // Midlands
  [0.48, 0.62, 4.5], // Birmingham
  [0.52, 0.58, 2.0], // Leicester/Nottingham
  [0.42, 0.58, 1.5], // Stoke/Wolverhampton
  [0.55, 0.55, 1.0], // Peterborough
  // North of England
  [0.45, 0.45, 4.0], // Manchester
  [0.5, 0.42, 3.0], // Leeds/Bradford
  [0.55, 0.38, 1.8], // Sheffield
  [0.48, 0.48, 1.5], // Liverpool
  [0.52, 0.32, 1.8], // Newcastle/Sunderland
  [0.48, 0.38, 0.8], // Hull
  // Wales
  [0.32, 0.68, 1.5], // Cardiff/Swansea
  [0.28, 0.58, 0.5], // Mid Wales
  // Scotland
  [0.42, 0.2, 3.0], // Glasgow
  [0.5, 0.18, 2.5], // Edinburgh
  [0.48, 0.12, 0.8], // Dundee/Aberdeen
  [0.38, 0.08, 0.3], // Inverness/Highlands
  // East
  [0.65, 0.68, 1.5], // Cambridge/Norwich
  [0.6, 0.65, 1.0], // Essex/Colchester
  // Southwest
  [0.35, 0.82, 1.0], // Exeter/Plymouth
  [0.42, 0.78, 1.2], // Bristol/Bath
];

// Box-Muller transform for gaussian jitter (seeded)
function gaussianJitter(seed: number, sigma: number): number {
  const u1 = Math.max(1e-10, seededRandom(seed));
  const u2 = seededRandom(seed + 1);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
}

function createNode(nodeId: number, cx: number, cy: number, sigma: number): Node {
  const seed = nodeId * 7 + 42;
  return {
    id: nodeId,
    x: Math.max(0.01, Math.min(0.99, cx + gaussianJitter(seed, sigma))),
    y: Math.max(0.01, Math.min(0.99, cy + gaussianJitter(seed + 2, sigma))),
    baseOpacity: 0.08,
    driftDuration: 10 + seededRandom(seed + 6) * 14,
    driftDelay: seededRandom(seed + 7) * -20,
    driftVariant: Math.floor(seededRandom(seed + 8) * 4),
  };
}

export function generateGraph(countryId: string = 'us'): Node[] {
  const centers = countryId === 'uk' ? UK_CENTERS : US_CENTERS;
  const totalWeight = centers.reduce((sum, c) => sum + c[2], 0);
  const nodes: Node[] = [];

  // Distribute NODE_COUNT dots proportionally across population centers
  let nodeId = 0;
  for (const [cx, cy, weight] of centers) {
    const count = Math.round((weight / totalWeight) * NODE_COUNT);
    // Jitter radius scales with weight (bigger cities spread more)
    const sigma = 0.02 + (weight / totalWeight) * 0.06;
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
const COLOR_PRIMARY: [number, number, number] = parseHex(colors.primary[500]);
const COLOR_PRIMARY_400: [number, number, number] = parseHex(colors.primary[400]);
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
    const ctx = canvas.getContext('2d');
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
        let tSize = NODE_SIZE;
        let useFastLerp = false;

        // Impact colouring (with radial wave delay)
        if (currentImpact && impactAge >= state.waveDelay) {
          const info = currentImpact.get(node.id);
          if (info && info.polarity !== 'neutral') {
            [tr, tg, tb] = info.polarity === 'positive' ? COLOR_PRIMARY : COLOR_NEGATIVE;
            tOpacity = 0.3 + info.magnitude * 0.2;
            tSize = NODE_SIZE * (1 + info.magnitude * 0.8);
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
        ctx.arc(px, py, half, 0, Math.PI * 2);
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
