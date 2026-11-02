import type { Reform } from '@/types/ingredients/Reform';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { V1PolicyContent } from '@/types/metadata/policyMetadata';

/**
 * The parameters a v1 policy sets that the current model no longer has, as
 * the API reports them. Empty when there are none, and when the API did not
 * check (an older API, or a check it could not run): only a list the API
 * returns blocks a run.
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
 * for changes no saved policy holds yet. The list holds only parameters
 * under `gov`, as the API's metadata sends them, so a path outside it is
 * not judged. Empty until the model's parameters have loaded, so nothing
 * is blocked before it can be checked.
 */
export function pathsMissingFromModel(
  paths: string[],
  parameters: ParameterMetadataCollection | null | undefined
): string[] {
  if (!parameters || Object.keys(parameters).length === 0) {
    return [];
  }
  return mergedParameterPaths(
    paths.filter((path) => path.startsWith('gov') && !Object.hasOwn(parameters, path))
  );
}
