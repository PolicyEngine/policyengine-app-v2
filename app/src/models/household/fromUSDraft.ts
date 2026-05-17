import type { USHouseholdDraft } from 'policyengine-household-wizard';
import { toV1HouseholdPayload } from 'policyengine-household-wizard';
import { Household } from '../Household';

export interface FromUSDraftOptions {
  id?: string;
  label?: string | null;
}

/**
 * Build an app-v2 `Household` from a `USHouseholdDraft` produced by
 * `policyengine-household-wizard`. The wizard's V1 envelope is the contract
 * we share with the package: this adapter pipes that envelope through
 * `Household.fromV1CreationPayload` so the household model only learns one
 * external schema.
 *
 * Verbose group keys (`"your tax unit"`, `"your household"`, …) keep the
 * resulting Household readable in app-v2's UI, matching the names produced
 * by `Household.starter` and friends.
 */
export function householdFromUSDraft(
  draft: USHouseholdDraft,
  options: FromUSDraftOptions = {}
): Household {
  if (draft.state === null) {
    throw new Error('USHouseholdDraft requires a state before conversion to Household.');
  }
  if (draft.people.length === 0) {
    throw new Error('USHouseholdDraft requires at least one person.');
  }

  const envelope = toV1HouseholdPayload(draft, {
    groupKeyStyle: 'verbose',
    includeMaritalUnit: draft.maritalStatus === 'married',
  });

  return Household.fromV1CreationPayload(
    {
      country_id: envelope.country_id,
      data: envelope.data,
      label: options.label ?? envelope.label ?? undefined,
    },
    { id: options.id, label: options.label ?? null }
  );
}
