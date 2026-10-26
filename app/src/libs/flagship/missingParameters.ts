import type { Reform } from '@/types/ingredients/Reform';
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

/** Every missing parameter of several policies, once each, in order. */
export function combinedMissingParameters(
  policies: Array<Pick<V1PolicyContent, 'missing_parameters'> | null | undefined>
): string[] {
  return [...new Set(policies.flatMap((policy) => policyMissingParameters(policy)))].sort();
}
