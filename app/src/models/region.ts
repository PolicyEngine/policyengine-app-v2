import type { CountryId } from '@/libs/countries';
import type { MetadataRegionEntry } from '@/types/metadata';

export type RegionCode = string;
export type RegionFilterStrategy = 'row_filter' | 'weight_replacement' | null;
export type RegionSource = 'v1_metadata';

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

const US_STATE_CODE_RE = /^[a-z]{2}$/i;
const US_DISTRICT_CODE_RE = /^[a-z]{2}-\d{1,2}$/i;
const US_LEGACY_STATE_CODE_RE = /^us-([a-z]{2})$/i;
const US_LEGACY_DISTRICT_CODE_RE = /^us-([a-z]{2}-\d{1,2})$/i;
const UK_LEGACY_COUNTRY_CODE_RE = /^uk-(.+)$/i;
const UK_COUNTRY_PREFIX = 'country/';
const UK_COUNTRY_CODES = new Set(['england', 'scotland', 'wales', 'northern_ireland']);

/** Northern Ireland's region code, as the UK region registry in policyengine.py names it. */
const NORTHERN_IRELAND_REGION_CODE: RegionCode = 'country/northern_ireland';

/**
 * Region codes the app no longer uses, each with the code that replaces
 * it. The Public API's metadata listed Northern Ireland as "country/ni",
 * so saved simulations, shared links, saved geographies and stored drafts
 * from that time can still carry it, and the Public API will refuse it.
 */
const REPLACED_REGION_CODES: Record<string, RegionCode> = {
  'country/ni': NORTHERN_IRELAND_REGION_CODE,
};

/**
 * The code the app uses for a region: a replaced code (in any case, with
 * any surrounding spaces) becomes its replacement, and any other code is
 * returned as given. Every place a region code enters the app, or leaves
 * it for the Public API, passes it through here.
 */
export function canonicalRegionCode(regionCode: string): RegionCode {
  return REPLACED_REGION_CODES[regionCode.trim().toLowerCase()] ?? regionCode;
}

/** "country/wales" for a bare UK country code ("wales", "ni"); null when it names no UK country. */
function ukCountryRegionCode(countryCode: string): RegionCode | null {
  const regionCode = canonicalRegionCode(`${UK_COUNTRY_PREFIX}${countryCode}`);
  return UK_COUNTRY_CODES.has(regionCode.slice(UK_COUNTRY_PREFIX.length)) ? regionCode : null;
}

function buildMetadataRegionId(countryId: CountryId, regionName: string): string {
  return `metadata:${countryId}:${regionName}`;
}

function normalizeUSDistrictId(districtId: string): string {
  const trimmedDistrictId = districtId.trim().toUpperCase();
  const match = trimmedDistrictId.match(/^([A-Z]{2})-(\d{1,2})$/);

  if (!match) {
    return trimmedDistrictId;
  }

  const [, state, num] = match;

  if (state === 'DC' && num === '98') {
    return 'DC-01';
  }

  if (num === '00') {
    return `${state}-01`;
  }

  return `${state}-${num.padStart(2, '0')}`;
}

function normalizeCongressionalDistrictCode(regionCode: string): string {
  const trimmedCode = regionCode.trim();
  const match = trimmedCode.match(/^(congressional_district\/)?([A-Za-z]{2}-\d{1,2})$/);

  if (!match) {
    return trimmedCode;
  }

  const [, prefix = '', districtId] = match;
  return `${prefix}${normalizeUSDistrictId(districtId)}`;
}

function getLegacyUSDistrictFetchAlias(regionCode: string): string | null {
  const trimmedCode = regionCode.trim();
  const districtMatch = trimmedCode.match(
    /^(?:congressional_district\/|us-)?([A-Za-z]{2}-\d{1,2})$/i
  );

  if (!districtMatch) {
    return null;
  }

  const normalizedDistrictId = normalizeUSDistrictId(districtMatch[1]);
  const [, state, num] = normalizedDistrictId.match(/^([A-Z]{2})-(\d{2})$/) ?? [];

  if (!state || !num) {
    return null;
  }

  if (state === 'DC' && num === '01') {
    return 'DC-98';
  }

  if (num === '01') {
    return `${state}-00`;
  }

  return null;
}

export function fromMetadataRegionEntry(
  countryId: CountryId,
  region: MetadataRegionEntry
): RegionRecord {
  const normalizedCode = normalizeRegionCode(countryId, region.name);

  return {
    id: buildMetadataRegionId(countryId, normalizedCode),
    countryId,
    code: normalizedCode,
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

  if (trimmedCode === countryId) {
    return trimmedCode;
  }

  if (countryId === 'us') {
    if (trimmedCode.startsWith('congressional_district/')) {
      return normalizeCongressionalDistrictCode(trimmedCode);
    }

    if (US_STATE_CODE_RE.test(trimmedCode)) {
      return `state/${trimmedCode.toLowerCase()}`;
    }

    if (US_DISTRICT_CODE_RE.test(trimmedCode)) {
      return `congressional_district/${normalizeUSDistrictId(trimmedCode)}`;
    }

    const legacyStateMatch = trimmedCode.match(US_LEGACY_STATE_CODE_RE);
    if (legacyStateMatch) {
      return `state/${legacyStateMatch[1].toLowerCase()}`;
    }

    const legacyDistrictMatch = trimmedCode.match(US_LEGACY_DISTRICT_CODE_RE);
    if (legacyDistrictMatch) {
      return `congressional_district/${normalizeUSDistrictId(legacyDistrictMatch[1])}`;
    }
  }

  if (trimmedCode.includes('/')) {
    return canonicalRegionCode(trimmedCode);
  }

  if (countryId === 'uk') {
    const countryRegionCode = ukCountryRegionCode(trimmedCode.toLowerCase().replace(/\s+/g, '_'));
    if (countryRegionCode) {
      return countryRegionCode;
    }

    const legacyCountryMatch = trimmedCode.match(UK_LEGACY_COUNTRY_CODE_RE);
    if (legacyCountryMatch) {
      const legacyCountryRegionCode = ukCountryRegionCode(
        legacyCountryMatch[1].toLowerCase().replace(/[-\s]+/g, '_')
      );
      if (legacyCountryRegionCode) {
        return legacyCountryRegionCode;
      }
    }
  }

  return trimmedCode;
}

export function getLegacyRegionCodeFallbacks(
  countryId: CountryId,
  regionCode: RegionCode
): RegionCode[] {
  if (countryId !== 'us') {
    return [];
  }

  const legacyAlias = getLegacyUSDistrictFetchAlias(regionCode);
  if (!legacyAlias) {
    return [];
  }

  return [`congressional_district/${legacyAlias}`];
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
    candidates.add(`${UK_COUNTRY_PREFIX}${trimmedCode.toLowerCase()}`);
    candidates.add(`constituency/${trimmedCode}`);
    candidates.add(`local_authority/${trimmedCode}`);
    candidates.add(`congressional_district/${trimmedCode.toUpperCase()}`);
  }

  return [...new Set([...candidates].map(canonicalRegionCode))];
}
