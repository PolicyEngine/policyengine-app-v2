import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  // Ambient drift params (unique per node)
  driftDuration: number;
  driftDelay: number;
  driftVariant: number; // which keyframe set (0-3)
}

export interface NodeImpact {
  polarity: 'positive' | 'negative' | 'neutral';
  magnitude: number; // 0-1, how strongly affected (used for scaling)
}

export type ImpactState = Map<number, NodeImpact>;

/**
 * Generate clustered impact patterns that respect the specified
 * winner/loser distribution for each prompt. Picks cluster centres
 * and assigns polarity based on the target percentages, so the
 * visualisation roughly matches the expected policy impact.
 */
export function generateImpactForPrompt(
  promptIndex: number,
  nodes: { id: number; x: number; y: number }[],
  winnerPct: number,
  loserPct: number
): ImpactState {
  const impact: ImpactState = new Map();
  const totalAffected = winnerPct + loserPct;

  // If nobody is affected, return all neutral
  if (totalAffected === 0) {
    for (const node of nodes) {
      impact.set(node.id, { polarity: 'neutral', magnitude: 0 });
    }
    return impact;
  }

  // Determine how many clusters of each polarity we need
  const winnerShare = winnerPct / totalAffected;
  const numClusters = 3 + Math.floor(seededRandom(promptIndex * 13) * 3); // 3-5
  const numWinnerClusters = Math.max(winnerPct > 0 ? 1 : 0, Math.round(numClusters * winnerShare));
  const numLoserClusters = Math.max(loserPct > 0 ? 1 : 0, numClusters - numWinnerClusters);

  // Scale cluster radii based on how many nodes need to be affected
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

  // First pass: assign nodes to clusters with falloff
  const targetWinners = Math.round(nodes.length * winnerPct);
  const targetLosers = Math.round(nodes.length * loserPct);
  let winnerCount = 0;
  let loserCount = 0;

  for (const node of nodes) {
    let assigned = false;
    for (const cluster of clusters) {
      // Check if we've already hit the target for this polarity
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
      baseOpacity: 0.3 + seededRandom(seed + 3) * 0.25,
      driftDuration: 10 + seededRandom(seed + 4) * 14, // 10-24s
      driftDelay: seededRandom(seed + 5) * -20, // negative = start mid-animation
      driftVariant: Math.floor(seededRandom(seed + 6) * 4),
    });
  }

  return nodes;
}

const GRAPH_KEYFRAMES = `
  @keyframes drift0 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(3px, -2px); }
    50% { transform: translate(-1px, 3px); }
    75% { transform: translate(-3px, -1px); }
  }
  @keyframes drift1 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-2px, 3px); }
    50% { transform: translate(3px, 1px); }
    75% { transform: translate(1px, -3px); }
  }
  @keyframes drift2 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(2px, 2px); }
    50% { transform: translate(-3px, -1px); }
    75% { transform: translate(1px, -2px); }
  }
  @keyframes drift3 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-1px, -3px); }
    50% { transform: translate(2px, -1px); }
    75% { transform: translate(-2px, 2px); }
  }
  @keyframes popIn {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

interface HouseholdGraphProps {
  nodes: Node[];
  impact: ImpactState | null;
}

export default function HouseholdGraph({ nodes, impact }: HouseholdGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 700 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);
  const pendingMouse = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pendingMouse.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setMousePos(pendingMouse.current);
        rafRef.current = 0;
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    setMousePos(null);
  }, []);

  // Compute proximity factor for each node to the mouse (0 = far, 1 = on top)
  const mouseProximity = useMemo(() => {
    if (!mousePos) {
      return new Map<number, number>();
    }
    const proximity = new Map<number, number>();
    for (const node of nodes) {
      const nx = node.x * dimensions.width;
      const ny = node.y * dimensions.height;
      const dx = nx - mousePos.x;
      const dy = ny - mousePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < HOVER_RADIUS) {
        proximity.set(node.id, 1 - dist / HOVER_RADIUS);
      }
    }
    return proximity;
  }, [mousePos, nodes, dimensions]);

  const getNodeColor = useCallback(
    (node: Node) => {
      const prox = mouseProximity.get(node.id);
      if (prox && prox > 0.7) {
        return colors.primary[500];
      }
      if (prox && prox > 0) {
        return colors.primary[400];
      }
      if (impact) {
        const info = impact.get(node.id);
        if (info?.polarity === 'positive') {
          return colors.success;
        }
        if (info?.polarity === 'negative') {
          return colors.error;
        }
      }
      return colors.gray[300];
    },
    [mouseProximity, impact]
  );

  const getNodeOpacity = useCallback(
    (node: Node) => {
      const prox = mouseProximity.get(node.id);
      if (prox) {
        return node.baseOpacity + prox * 0.5;
      }
      if (impact) {
        const info = impact.get(node.id);
        if (info && info.polarity !== 'neutral') {
          return 0.5 + info.magnitude * 0.4;
        }
      }
      return node.baseOpacity;
    },
    [mouseProximity, impact]
  );

  const getNodeSize = useCallback(
    (node: Node) => {
      const prox = mouseProximity.get(node.id);
      // Mouse proximity scales the dot up smoothly
      const mouseScale = prox ? 1 + prox * 0.8 : 1;
      if (impact) {
        const info = impact.get(node.id);
        if (info && info.polarity !== 'neutral') {
          return node.size * Math.max(mouseScale, 1 + info.magnitude * 0.8);
        }
      }
      return node.size * mouseScale;
    },
    [mouseProximity, impact]
  );

  // Radial wave delay: nodes near centre of viewport change first
  const getTransitionDelay = useCallback(
    (node: Node) => {
      if (mousePos) {
        return '0s'; // instant feedback when mouse is active
      }
      const dx = node.x - 0.5;
      const dy = node.y - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return `${(dist / 0.7) * 0.6}s`;
    },
    [mousePos]
  );

  const px = (n: Node) => n.x * dimensions.width;
  const py = (n: Node) => n.y * dimensions.height;

  // Entrance delay: radial from centre, staggered over ~1s
  const getPopDelay = useCallback((node: Node) => {
    const dx = node.x - 0.5;
    const dy = node.y - 0.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return (dist / 0.7) * 0.8; // 0-0.8s based on distance from centre
  }, []);

  return (
    <>
      <style>{GRAPH_KEYFRAMES}</style>
      <svg
        ref={svgRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'all',
        }}
      >
        {nodes.map((node) => {
          const s = getNodeSize(node);
          const popDelay = getPopDelay(node);
          return (
            <rect
              key={node.id}
              x={px(node) - s / 2}
              y={py(node) - s / 2}
              width={s}
              height={s}
              rx={1.5}
              ry={1.5}
              fill={getNodeColor(node)}
              opacity={getNodeOpacity(node)}
              style={{
                transformOrigin: `${px(node)}px ${py(node)}px`,
                transition: `fill 0.5s ease ${getTransitionDelay(node)}, opacity 0.5s ease ${getTransitionDelay(node)}, width 0.3s ease, height 0.3s ease, x 0.3s ease, y 0.3s ease`,
                animation: `popIn 0.5s ease-out ${popDelay}s both, drift${node.driftVariant} ${node.driftDuration}s ease-in-out ${popDelay + 0.5}s infinite`,
              }}
            />
          );
        })}
      </svg>
    </>
  );
}
