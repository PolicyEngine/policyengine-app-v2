import type { Reform } from '@/types/ingredients/Reform';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { V1PolicyContent } from '@/types/metadata/policyMetadata';

/**
 * The parameters a v1 policy sets that the current model no longer has, as
 * the API reports them. Empty when there are none, and when the API did not
 * check (an older API, or a check it could not run): the API's answer blocks
 * a run only with a list. The browser's own check of a draft's or a
 * report's changes (`pathsMissingFromModel`) stands apart from it.
 */
export function policyMissingParameters(
  policy: Pick<V1PolicyContent, 'missing_parameters'> | null | undefined
): string[] {
  const reported = policy?.missing_parameters;
  return Array.isArray(reported) ? reported.filter((path) => typeof path === 'string') : [];
}

/** The parameters a saved reform's policy sets that the model no longer has. */
export function reformMissingParameters(
  reform: Pick<Reform, 'missingParameters'> | null | undefined
): string[] {
  return reform?.missingParameters ?? [];
}

/** Every path in several lists, once each, in order. */
export function mergedParameterPaths(...pathLists: string[][]): string[] {
  return [...new Set(pathLists.flat())].sort();
}

/** Every missing parameter of several policies, once each, in order. */
export function combinedMissingParameters(
  policies: Array<Pick<V1PolicyContent, 'missing_parameters'> | null | undefined>
): string[] {
  return mergedParameterPaths(...policies.map((policy) => policyMissingParameters(policy)));
}

/**
 * The parameter paths that the current model's parameter list does not
 * have, once each, in order: changes a draft kept, or a report ran, from
 * before the model dropped them. A check in the browser beside the API's,
 * for changes the API has not checked: a draft's, and the changes a saved
 * report keeps, which Re-run sends whatever the API could read of the
 * report's policies. As the API's own check does, it counts only
 * leaf parameters: a path the list holds as a node (one that holds other
 * parameters) is missing too, since no policy can set it. The list holds
 * only parameters under `gov`, as the API's metadata sends them, so a path
 * outside it is not judged. Empty until the model's parameters have
 * loaded, so nothing is blocked before it can be checked.
 *
 * On the v2 routes the parameters load on demand, so the list holds only
 * those loaded so far: pass `catalogMissingNames`, the names the catalog
 * version said it does not have. A path is then missing when the catalog
 * lacks it, or when it is loaded as a node; a path not loaded yet is not
 * judged.
 */
export function pathsMissingFromModel(
  paths: string[],
  parameters: ParameterMetadataCollection | null | undefined,
  catalogMissingNames?: readonly string[]
): string[] {
  const loaded = parameters ?? {};
  const isLeafParameter = (path: string) =>
    Object.hasOwn(loaded, path) && loaded[path].type === 'parameter';
  if (catalogMissingNames) {
    const lacked = new Set(catalogMissingNames);
    return mergedParameterPaths(
      paths.filter(
        (path) =>
          path.startsWith('gov') &&
          (lacked.has(path) || (Object.hasOwn(loaded, path) && !isLeafParameter(path)))
      )
    );
  }
  if (Object.keys(loaded).length === 0) {
    return [];
  }
  return mergedParameterPaths(
    paths.filter((path) => path.startsWith('gov') && !isLeafParameter(path))
  );
}
