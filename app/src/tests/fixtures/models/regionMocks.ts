import type { MetadataRegionEntry } from '@/types/metadata';
import { UK_REGION_TYPES } from '@/types/regionTypes';

/** Northern Ireland's region code, as the UK region registry in policyengine.py names it. */
export const NORTHERN_IRELAND_REGION_CODE = 'country/northern_ireland';

/**
 * The code the Public API's metadata listed for Northern Ireland before
 * it adopted the one above. Saved simulations, shared links and stored
 * drafts from that time still carry it.
 */
export const LEGACY_NORTHERN_IRELAND_REGION_CODE = 'country/ni';

/** Other spellings of Northern Ireland that older saved work and links carry. */
export const LEGACY_NORTHERN_IRELAND_SPELLINGS = [
  LEGACY_NORTHERN_IRELAND_REGION_CODE,
  'COUNTRY/NI',
  ' country/ni ',
  'ni',
  'NI',
  'uk-ni',
  'Northern Ireland',
  'northern_ireland',
] as const;

export const NORTHERN_IRELAND_LABEL = 'Northern Ireland';

const GREAT_BRITAIN_METADATA_REGIONS: MetadataRegionEntry[] = [
  { name: 'uk', label: 'the UK', type: UK_REGION_TYPES.NATIONAL },
  { name: 'country/england', label: 'England', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/scotland', label: 'Scotland', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/wales', label: 'Wales', type: UK_REGION_TYPES.COUNTRY },
];

/** The UK's regions as the Public API's metadata lists them today, with "country/ni". */
export const LEGACY_UK_METADATA_REGIONS: MetadataRegionEntry[] = [
  ...GREAT_BRITAIN_METADATA_REGIONS,
  {
    name: LEGACY_NORTHERN_IRELAND_REGION_CODE,
    label: NORTHERN_IRELAND_LABEL,
    type: UK_REGION_TYPES.COUNTRY,
  },
];

/** The UK's regions as the Public API's metadata will list them, with "country/northern_ireland". */
export const CURRENT_UK_METADATA_REGIONS: MetadataRegionEntry[] = [
  ...GREAT_BRITAIN_METADATA_REGIONS,
  {
    name: NORTHERN_IRELAND_REGION_CODE,
    label: NORTHERN_IRELAND_LABEL,
    type: UK_REGION_TYPES.COUNTRY,
  },
];

/** Each metadata spelling, for tests that must pass with either. */
export const UK_METADATA_REGION_SPELLINGS = [
  ['country/ni', LEGACY_UK_METADATA_REGIONS],
  ['country/northern_ireland', CURRENT_UK_METADATA_REGIONS],
] as const;
