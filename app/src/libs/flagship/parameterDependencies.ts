/**
 * Parameter → variable dependency map, traced from the model.
 *
 * `app/scripts/build-parameter-dependency-map.py` runs policyengine-us with
 * core's FullTracer and records which variables read each parameter path
 * and which variables consume each variable. This module answers the
 * question the validation layer needs: given a reform's parameter paths,
 * which model variables does it move, and how far downstream? Depth is the
 * validation "ring": 0–1 is the primary variable, 2–4 the mechanism it
 * feeds, deeper is incidental.
 *
 * The JSON is loaded lazily — it is a few hundred kilobytes and only the
 * validation surfaces need it.
 */

export interface ParameterDependencyMap {
  generatedAt: string;
  model: {
    package: string;
    version: string;
    coreVersion: string;
    dataset: string | null;
    households: number;
    year: number;
  };
  /** parameter path (as the model reads it) → variables whose formula read it */
  readers: Record<string, string[]>;
  /** variable → variables whose formula read it */
  consumers: Record<string, string[]>;
}

export interface ReachedVariable {
  variable: string;
  /** 0 = reads the parameter directly; n = n formula hops downstream. */
  depth: number;
  /** The parameter path (depth 0) or upstream variable it was reached through. */
  via: string;
}

/**
 * Default reach for validation matching. Program outputs sit a few hops
 * from the parameters that drive them (SNAP's standard deduction reaches
 * `snap` at depth 6); anything beyond this is the tax-benefit system
 * echoing the change, not the mechanism.
 */
export const DEFAULT_MAX_DEPTH = 6;

/**
 * The model records bracket and vectorial reads at the node it indexed,
 * so `gov.irs.credits.ctc.amount.base[0].amount` is read as
 * `gov.irs.credits.ctc.amount.base`. Strip from the first index onward.
 */
export function normalizeParameterPath(path: string): string {
  const cut = path.indexOf('[');
  return (cut === -1 ? path : path.slice(0, cut)).replace(/\.+$/, '');
}

function isPrefixPath(prefix: string, path: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`);
}

/**
 * Variables whose formula reads `path`. Matches the most specific recorded
 * ancestor of the path (a bracket read is recorded at its scale node), and
 * otherwise every recorded descendant (the reform named a folder).
 */
export function readersOfPath(path: string, map: ParameterDependencyMap): string[] {
  const normalized = normalizeParameterPath(path);
  let bestAncestor: string | null = null;
  const descendants = new Set<string>();
  for (const recorded of Object.keys(map.readers)) {
    if (isPrefixPath(recorded, normalized)) {
      if (bestAncestor === null || recorded.length > bestAncestor.length) {
        bestAncestor = recorded;
      }
    } else if (isPrefixPath(normalized, recorded)) {
      for (const variable of map.readers[recorded]) {
        descendants.add(variable);
      }
    }
  }
  if (bestAncestor !== null) {
    return [...map.readers[bestAncestor]];
  }
  return [...descendants].sort();
}

/**
 * Breadth-first walk from the readers of each path through the consumer
 * graph. Each variable appears once, at its shortest depth, ordered by
 * depth then name.
 */
export function variablesReachedByPaths(
  paths: string[],
  map: ParameterDependencyMap,
  maxDepth: number = DEFAULT_MAX_DEPTH
): ReachedVariable[] {
  const reached = new Map<string, ReachedVariable>();
  let frontier: ReachedVariable[] = [];
  for (const path of paths) {
    for (const variable of readersOfPath(path, map)) {
      if (!reached.has(variable)) {
        const entry = { variable, depth: 0, via: path };
        reached.set(variable, entry);
        frontier.push(entry);
      }
    }
  }
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const next: ReachedVariable[] = [];
    for (const upstream of frontier) {
      for (const consumer of map.consumers[upstream.variable] ?? []) {
        if (!reached.has(consumer)) {
          const entry = { variable: consumer, depth, via: upstream.variable };
          reached.set(consumer, entry);
          next.push(entry);
        }
      }
    }
    frontier = next;
  }
  return [...reached.values()].sort(
    (a, b) => a.depth - b.depth || a.variable.localeCompare(b.variable)
  );
}

let cached: Promise<ParameterDependencyMap> | null = null;

/** The traced map for policyengine-us, loaded once per session. */
export function loadParameterDependencies(): Promise<ParameterDependencyMap> {
  if (!cached) {
    cached = import('@/data/flagship/parameterDependencies.json').then(
      (module) => module.default as ParameterDependencyMap
    );
    cached.catch(() => {
      cached = null;
    });
  }
  return cached;
}
