import type { ComparableHousehold } from './canonicalTypes';
import { sortRecordKeysRecursively } from './utils';
import type { V2CreateHouseholdEnvelope } from './v2Types';

export function buildComparableHousehold(args: {
  id: string;
  envelope: V2CreateHouseholdEnvelope;
}): ComparableHousehold {
  const comparableData = {
    people: args.envelope.people,
    tax_unit: args.envelope.tax_unit ?? null,
    family: args.envelope.family ?? null,
    spm_unit: args.envelope.spm_unit ?? null,
    marital_unit: args.envelope.marital_unit ?? null,
    household: args.envelope.household ?? null,
    benunit: args.envelope.benunit ?? null,
  };

  return {
    id: args.id,
    countryId: args.envelope.country_id,
    year: args.envelope.year,
    label: args.envelope.label ?? null,
    data: sortRecordKeysRecursively(comparableData) as Record<string, unknown>,
  };
}
