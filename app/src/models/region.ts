import type { V2RegionMetadata } from '@/api/v2/regions';
import type { CountryId } from '@/libs/countries';
import type { MetadataRegionEntry } from '@/types/metadata';

export type RegionCode = string;
export type RegionFilterStrategy = 'row_filter' | 'weight_replacement' | null;
export type RegionSource = 'v1_metadata' | 'v2_api';

export interface Region {
  id: string;
  countryId: CountryId;
  code: RegionCode;
  label: string;
  regionType: string;
  parentCode: string | null;
  filterField: string | null;
  filterValue: string | null;
  filterStrategy: RegionFilterStrategy;
  requiresFilter: boolean;
  stateCode: string | null;
  stateName: string | null;
  source?: RegionSource;
  sourceId?: string | null;
}

export type RegionRecord = Region;

export interface ResolvedRegionTarget {
  countryId: CountryId;
  code: RegionCode;
  regionId: string;
  label: string | null;
  regionType: string | null;
  filterField: string | null;
  filterValue: string | null;
  filterStrategy: RegionFilterStrategy;
}

type V2RegionSource = Pick<
  V2RegionMetadata,
  | 'id'
  | 'code'
  | 'label'
  | 'region_type'
  | 'parent_code'
  | 'filter_field'
  | 'filter_value'
  | 'requires_filter'
> & {
  filter_strategy?: RegionFilterStrategy;
  state_code?: string | null;
  state_name?: string | null;
};

const US_STATE_CODE_RE = /^[a-z]{2}$/i;
const US_DISTRICT_CODE_RE = /^[a-z]{2}-\d{1,2}$/i;
const US_LEGACY_STATE_CODE_RE = /^us-([a-z]{2})$/i;
const US_LEGACY_DISTRICT_CODE_RE = /^us-([a-z]{2}-\d{1,2})$/i;
const UK_LEGACY_COUNTRY_CODE_RE = /^uk-(.+)$/i;
const UK_COUNTRY_CODES = new Set(['england', 'scotland', 'wales', 'ni', 'northern_ireland']);

function buildMetadataRegionId(countryId: CountryId, regionName: string): string {
  return `metadata:${countryId}:${regionName}`;
}

export function fromMetadataRegionEntry(
  countryId: CountryId,
  region: MetadataRegionEntry
): RegionRecord {
  return {
    id: buildMetadataRegionId(countryId, region.name),
    countryId,
    code: region.name,
    label: region.label,
    regionType: region.type,
    parentCode: null,
    filterField: null,
    filterValue: null,
    filterStrategy: null,
    requiresFilter: false,
    stateCode: region.state_abbreviation ?? null,
    stateName: region.state_name ?? null,
    source: 'v1_metadata',
    sourceId: null,
  };
}

export function fromV2RegionMetadata(countryId: CountryId, region: V2RegionSource): RegionRecord {
  return {
    id: region.id,
    countryId,
    code: region.code,
    label: region.label,
    regionType: region.region_type,
    parentCode: region.parent_code,
    filterField: region.filter_field,
    filterValue: region.filter_value,
    filterStrategy: region.filter_strategy ?? null,
    requiresFilter: region.requires_filter,
    stateCode: region.state_code ?? null,
    stateName: region.state_name ?? null,
    source: 'v2_api',
    sourceId: region.id,
  };
}

// Compatibility alias for existing v2 callers while the Region refactor lands.
export const toRegionRecord = fromV2RegionMetadata;

export function createResolvedRegionTarget(args: {
  region: RegionRecord;
  filterStrategy?: RegionFilterStrategy;
}): ResolvedRegionTarget {
  const { filterStrategy = args.region.filterStrategy, region } = args;

  return {
    countryId: region.countryId,
    code: region.code,
    regionId: region.id,
    label: region.label,
    regionType: region.regionType,
    filterField: region.filterField,
    filterValue: region.filterValue,
    filterStrategy,
  };
}

export function normalizeRegionCode(countryId: CountryId, regionCode: string): RegionCode {
  const trimmedCode = regionCode.trim();

  if (!trimmedCode) {
    return trimmedCode;
  }

  if (trimmedCode === countryId || trimmedCode.includes('/')) {
    return trimmedCode;
  }

  if (countryId === 'us') {
    if (US_STATE_CODE_RE.test(trimmedCode)) {
      return `state/${trimmedCode.toLowerCase()}`;
    }

    if (US_DISTRICT_CODE_RE.test(trimmedCode)) {
      return `congressional_district/${trimmedCode.toUpperCase()}`;
    }

    const legacyStateMatch = trimmedCode.match(US_LEGACY_STATE_CODE_RE);
    if (legacyStateMatch) {
      return `state/${legacyStateMatch[1].toLowerCase()}`;
    }

    const legacyDistrictMatch = trimmedCode.match(US_LEGACY_DISTRICT_CODE_RE);
    if (legacyDistrictMatch) {
      return `congressional_district/${legacyDistrictMatch[1].toUpperCase()}`;
    }
  }

  if (countryId === 'uk') {
    const normalizedCode = trimmedCode.toLowerCase().replace(/\s+/g, '_');
    if (UK_COUNTRY_CODES.has(normalizedCode)) {
      return `country/${normalizedCode}`;
    }

    const legacyCountryMatch = trimmedCode.match(UK_LEGACY_COUNTRY_CODE_RE);
    if (legacyCountryMatch) {
      const normalizedLegacyCode = legacyCountryMatch[1].toLowerCase().replace(/[-\s]+/g, '_');
      if (UK_COUNTRY_CODES.has(normalizedLegacyCode)) {
        return `country/${normalizedLegacyCode}`;
      }
    }
  }

  return trimmedCode;
}

export function getRegionCodeCandidates(regionCode: string): RegionCode[] {
  const trimmedCode = regionCode.trim();
  if (!trimmedCode) {
    return [];
  }

  const candidates = new Set<RegionCode>([trimmedCode]);

  for (const countryId of ['us', 'uk'] as const) {
    candidates.add(normalizeRegionCode(countryId, trimmedCode));
  }

  if (!trimmedCode.includes('/')) {
    candidates.add(`state/${trimmedCode.toLowerCase()}`);
    candidates.add(`country/${trimmedCode.toLowerCase()}`);
    candidates.add(`constituency/${trimmedCode}`);
    candidates.add(`local_authority/${trimmedCode}`);
    candidates.add(`congressional_district/${trimmedCode.toUpperCase()}`);
  }

  return [...candidates];
}
