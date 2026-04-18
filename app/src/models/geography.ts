import type { CountryId } from '@/libs/countries';
import {
  getRegionCodeCandidates,
  normalizeRegionCode,
  type RegionCode,
  type RegionRecord,
} from '@/models/region';
import type { Geography } from '@/types/ingredients/Geography';
import { extractRegionDisplayValue } from '@/utils/regionStrategies';

export interface SavedGeographySelection {
  id?: string;
  countryId: CountryId;
  scope: Geography['scope'];
  geographyId: string;
  label?: string;
}

const COUNTRY_LABELS: Record<CountryId, string> = {
  us: 'United States',
  uk: 'United Kingdom',
  ca: 'Canada',
  ng: 'Nigeria',
  il: 'Israel',
};

export function getCountryDisplayName(countryId: CountryId): string {
  return COUNTRY_LABELS[countryId] ?? countryId.toUpperCase();
}

export function findRegionRecord(
  regions: RegionRecord[] | undefined,
  countryId: CountryId,
  regionCode: string
): RegionRecord | undefined {
  if (!regions?.length) {
    return undefined;
  }

  const codeCandidates = new Set<RegionCode>(
    getRegionCodeCandidates(regionCode).map((candidate) =>
      normalizeRegionCode(countryId, candidate)
    )
  );

  return regions.find(
    (region) => region.countryId === countryId && codeCandidates.has(region.code)
  );
}

export function getCanonicalGeographyCode(
  countryId: CountryId,
  scope: Geography['scope'],
  geographyId: string,
  regions?: RegionRecord[]
): string {
  if (scope === 'national') {
    return countryId;
  }

  return (
    findRegionRecord(regions, countryId, geographyId)?.code ??
    normalizeRegionCode(countryId, geographyId)
  );
}

export function getGeographyDisplayName(
  countryId: CountryId,
  scope: Geography['scope'],
  geographyId: string,
  regions?: RegionRecord[]
): string {
  if (scope === 'national') {
    return getCountryDisplayName(countryId);
  }

  const canonicalCode = getCanonicalGeographyCode(countryId, scope, geographyId, regions);
  return (
    findRegionRecord(regions, countryId, canonicalCode)?.label ??
    extractRegionDisplayValue(canonicalCode)
  );
}

export function buildCanonicalGeography(args: {
  countryId: CountryId;
  scope: Geography['scope'];
  geographyId: string;
  regions?: RegionRecord[];
  id?: string;
}): Geography {
  const { countryId, geographyId, id, regions, scope } = args;
  const canonicalCode = getCanonicalGeographyCode(countryId, scope, geographyId, regions);

  return {
    id: id ?? canonicalCode,
    countryId,
    scope,
    geographyId: canonicalCode,
    name: getGeographyDisplayName(countryId, scope, canonicalCode, regions),
  };
}

export function createSavedGeographySelection(args: {
  geography: Geography;
  id?: string;
  label?: string | null;
}): SavedGeographySelection {
  const { geography, id, label } = args;

  return {
    id,
    countryId: geography.countryId,
    scope: geography.scope,
    geographyId: geography.geographyId,
    label: label ?? geography.name ?? undefined,
  };
}

type GeographyRegionType =
  | 'national'
  | 'state'
  | 'congressional_district'
  | 'place'
  | 'country'
  | 'constituency'
  | 'local_authority'
  | 'region';

export function getGeographyRegionType(geography: Geography): GeographyRegionType {
  if (geography.scope === 'national') {
    return 'national';
  }

  const [regionType] = geography.geographyId.split('/', 1);

  switch (regionType) {
    case 'state':
    case 'congressional_district':
    case 'place':
    case 'country':
    case 'constituency':
    case 'local_authority':
      return regionType;
    default:
      return 'region';
  }
}

export function getGeographyRegionTypeLabel(geography: Geography): string {
  switch (getGeographyRegionType(geography)) {
    case 'national':
      return 'National';
    case 'state':
      return 'State';
    case 'congressional_district':
      return 'Congressional district';
    case 'place':
      return 'City';
    case 'country':
      return 'Country';
    case 'constituency':
      return 'Constituency';
    case 'local_authority':
      return 'Local authority';
    default:
      return 'Region';
  }
}
