import type { CanonicalHouseholdSetup, ComparableHousehold } from './canonicalTypes';
import { sortRecordKeysRecursively } from './utils';
import { buildV2CreateEnvelope } from './v2Codec';

export function buildComparableHousehold(args: {
  id: string;
  setup: CanonicalHouseholdSetup;
}): ComparableHousehold {
  const v2Envelope = buildV2CreateEnvelope(args.setup);
  const comparableData = {
    people: v2Envelope.people,
    tax_unit: v2Envelope.tax_unit ?? null,
    family: v2Envelope.family ?? null,
    spm_unit: v2Envelope.spm_unit ?? null,
    marital_unit: v2Envelope.marital_unit ?? null,
    household: v2Envelope.household ?? null,
    benunit: v2Envelope.benunit ?? null,
  };

  return {
    id: args.id,
    countryId: args.setup.countryId,
    year: v2Envelope.year,
    label: args.setup.label,
    data: sortRecordKeysRecursively(comparableData) as Record<string, unknown>,
  };
}
