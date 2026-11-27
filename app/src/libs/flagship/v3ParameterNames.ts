import { groupKeyFromPath } from '@/libs/flagship/parameterGroups';
import { growthIndexPaths } from '@/libs/flagship/uprating';
import type { Reform } from '@/types/ingredients/Reform';

/**
 * Which parameters a v3 view needs from the metadata store, so that on the
 * v2 routes, where the store holds only what has been loaded, the view can
 * load them in one request before it shows (see useEnsureV3Parameters).
 */

const pathsByGroupKey = new WeakMap<Set<string>, Map<string, string[]>>();

function groupIndex(addablePaths: Set<string>): Map<string, string[]> {
  let index = pathsByGroupKey.get(addablePaths);
  if (!index) {
    index = new Map<string, string[]>();
    for (const path of addablePaths) {
      const key = groupKeyFromPath(path);
      index.set(key, [...(index.get(key) ?? []), path]);
    }
    pathsByGroupKey.set(addablePaths, index);
  }
  return index;
}

/**
 * A parameter and the members of the group the draft editor shows it in
 * (a breakdown's other members, a schedule's other brackets), among the
 * parameters a draft can take.
 */
export function groupMemberPaths(path: string, addablePaths: Set<string>): string[] {
  return [...new Set([path, ...(groupIndex(addablePaths).get(groupKeyFromPath(path)) ?? [])])];
}

/**
 * What the draft editor reads for a draft: each provision, its group's
 * members, the index a provision grows with, and the indexes a value can
 * be set to grow with.
 */
export function draftParameterNames(
  provisions: ReadonlyArray<{ path: string; growth?: string }>,
  addablePaths: Set<string>,
  countryId: string
): string[] {
  const names = new Set<string>(growthIndexPaths(countryId));
  for (const provision of provisions) {
    for (const path of groupMemberPaths(provision.path, addablePaths)) {
      names.add(path);
    }
    if (provision.growth && provision.growth !== 'fixed' && provision.growth !== 'current_law') {
      names.add(provision.growth);
    }
  }
  return [...names].sort();
}

/** Every parameter the reforms change. */
export function reformParameterNames(reforms: ReadonlyArray<Pick<Reform, 'parameters'>>): string[] {
  return [
    ...new Set(reforms.flatMap((reform) => reform.parameters.map((parameter) => parameter.name))),
  ].sort();
}
