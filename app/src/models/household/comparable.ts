import type { ComparableHousehold } from './appTypes';
import { sortRecordKeysRecursively } from './utils';
import type { V2CreateHouseholdEnvelope } from './v2Types';

export function buildComparableHousehold(args: {
  id: string;
  envelope: V2CreateHouseholdEnvelope;
}): ComparableHousehold {
  const comparableData = {
    people: args.envelope.people,
    tax_unit: args.envelope.tax_unit,
    family: args.envelope.family,
    spm_unit: args.envelope.spm_unit,
    marital_unit: args.envelope.marital_unit,
    household: args.envelope.household,
    benunit: args.envelope.benunit,
  };

  return {
    id: args.id,
    countryId: args.envelope.country_id,
    year: args.envelope.year,
    label: args.envelope.label ?? null,
    data: sortRecordKeysRecursively(comparableData) as Record<string, unknown>,
  };
}
