/**
 * Household inputs a reform makes worth filling in: the input variables
 * upstream of the variables its parameters feed directly, nearest first.
 * A SNAP change suggests expenses and income SNAP counts; a CTC change,
 * children's ages and earnings — so the builder's variable search can
 * lead with them instead of the whole alphabet.
 */
import {
  ParameterDependencyMap,
  variablesReachedByPaths,
} from '@/libs/flagship/parameterDependencies';

/** Steps upstream from the changed variables: enough for rent → housing cost → SNAP. */
const MAX_UPSTREAM = 8;
const DEFAULT_LIMIT = 12;

/**
 * Inputs a reader does not describe a household with: survey weights,
 * reported amounts and take-up draws the microdata sets, and ids.
 */
const NOT_HOUSEHOLD_FACTS =
  /(^|_)(weight|reported|takes_up|takeup|would_claim|id|seed|imputed)($|_)/;

export function suggestedHouseholdInputs(
  paths: string[],
  map: ParameterDependencyMap,
  inputs: Set<string>,
  limit: number = DEFAULT_LIMIT
): string[] {
  // The variables the parameters feed, and the ones one step on.
  const start = variablesReachedByPaths(paths, map, 1).map((entry) => entry.variable);
  if (start.length === 0) {
    return [];
  }
  const readsFrom = new Map<string, string[]>();
  for (const [variable, users] of Object.entries(map.consumers)) {
    for (const user of users) {
      const list = readsFrom.get(user) ?? [];
      list.push(variable);
      readsFrom.set(user, list);
    }
  }
  const distance = new Map<string, number>(start.map((variable) => [variable, 0]));
  let frontier = start;
  for (let step = 1; step <= MAX_UPSTREAM && frontier.length > 0; step++) {
    const next: string[] = [];
    for (const variable of frontier) {
      for (const read of readsFrom.get(variable) ?? []) {
        if (!distance.has(read)) {
          distance.set(read, step);
          next.push(read);
        }
      }
    }
    frontier = next;
  }
  return [...distance.entries()]
    .filter(([variable]) => inputs.has(variable) && !NOT_HOUSEHOLD_FACTS.test(variable))
    .sort(([a, da], [b, db]) => da - db || a.localeCompare(b))
    .slice(0, limit)
    .map(([variable]) => variable);
}
