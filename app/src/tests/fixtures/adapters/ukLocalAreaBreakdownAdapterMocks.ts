import { fromMetadataRegionEntry, type Region } from '@/models/region';
import type { MetadataRegionEntry } from '@/types/metadata';

/** A local authority in .py 6.10.0's list that the Public API listed only from #4024 on. */
export const ARDS_AND_NORTH_DOWN = 'Ards and North Down';

/** The UK's local authorities in the metadata fixture below, before Ards and North Down. */
const LOCAL_AUTHORITY_ENTRIES_BEFORE_ARDS_AND_NORTH_DOWN: MetadataRegionEntry[] = [
  { name: 'local_authority/Hartlepool', label: 'Hartlepool', type: 'local_authority' },
  { name: 'local_authority/Middlesbrough', label: 'Middlesbrough', type: 'local_authority' },
];

/** The UK's nations and constituencies as the Public API's metadata gives them, trimmed. */
const NATION_AND_CONSTITUENCY_ENTRIES: MetadataRegionEntry[] = [
  { name: 'uk', label: 'the UK', type: 'national' },
  { name: 'country/scotland', label: 'Scotland', type: 'country' },
  {
    name: 'constituency/East Kilbride and Strathaven',
    label: 'East Kilbride and Strathaven',
    type: 'constituency',
  },
  { name: 'constituency/Aldershot', label: 'Aldershot', type: 'constituency' },
  { name: 'constituency/Aldridge-Brownhills', label: 'Aldridge-Brownhills', type: 'constituency' },
];

const ARDS_AND_NORTH_DOWN_ENTRY: MetadataRegionEntry = {
  name: `local_authority/${ARDS_AND_NORTH_DOWN}`,
  label: ARDS_AND_NORTH_DOWN,
  type: 'local_authority',
};

/**
 * The UK's region list as the Public API's metadata gives it from
 * PolicyEngine/policyengine-api#4024 on, trimmed to a few areas: its local
 * authorities include Ards and North Down, as .py 6.10.0's 361 do.
 */
export const UK_METADATA_REGIONS: Region[] = [
  ...NATION_AND_CONSTITUENCY_ENTRIES,
  ...LOCAL_AUTHORITY_ENTRIES_BEFORE_ARDS_AND_NORTH_DOWN,
  ARDS_AND_NORTH_DOWN_ENTRY,
].map((entry) => fromMetadataRegionEntry('uk', entry));

/**
 * The same list from a Public API deployment before #4024, whose 360 local
 * authorities leave out Ards and North Down.
 */
export const UK_METADATA_REGIONS_WITHOUT_ARDS_AND_NORTH_DOWN: Region[] = [
  ...NATION_AND_CONSTITUENCY_ENTRIES,
  ...LOCAL_AUTHORITY_ENTRIES_BEFORE_ARDS_AND_NORTH_DOWN,
].map((entry) => fromMetadataRegionEntry('uk', entry));

export const METADATA_CONSTITUENCY_COUNT = 3;
export const METADATA_LOCAL_AUTHORITY_COUNT = 3;

/** One of the metadata's constituencies, published by a breakdown. */
export const PUBLISHED_CONSTITUENCY_NAMES = ['East Kilbride and Strathaven'];

/** One of the metadata's local authorities, published by a breakdown. */
export const PUBLISHED_LOCAL_AUTHORITY_NAMES = ['Hartlepool'];

/** A published name the metadata does not list, so the lists disagree. */
export const UNLISTED_CONSTITUENCY_NAME = 'Ynys Mon';

/**
 * A published local authority name the metadata does not list, as for a
 * renamed area: the Public API names this one "Kingston upon Hull, City of".
 */
export const UNLISTED_LOCAL_AUTHORITY_NAME = 'Kingston upon Hull';

/** The withheld constituencies a UK-wide breakdown of the fixture's areas leaves. */
export const UK_WIDE_WITHHELD_CONSTITUENCIES = {
  withheld: METADATA_CONSTITUENCY_COUNT - PUBLISHED_CONSTITUENCY_NAMES.length,
  total: METADATA_CONSTITUENCY_COUNT,
};

/** The withheld local authorities a UK-wide breakdown of the fixture's areas leaves. */
export const UK_WIDE_WITHHELD_LOCAL_AUTHORITIES = {
  withheld: METADATA_LOCAL_AUTHORITY_COUNT - PUBLISHED_LOCAL_AUTHORITY_NAMES.length,
  total: METADATA_LOCAL_AUTHORITY_COUNT,
};

/** Wales's constituencies and local authorities in the boundary files. */
export const WALES_CONSTITUENCY_COUNT = 32;
export const WALES_LOCAL_AUTHORITY_COUNT = 22;

/** Two Welsh constituencies a Wales breakdown published, by name and ONS code. */
export const PUBLISHED_WELSH_CONSTITUENCY_NAMES = ['Gower', 'Cardiff East'];
export const PUBLISHED_WELSH_CONSTITUENCY_CODES = ['W07000094', 'W07000084'];

/** An English constituency's code, which no Wales breakdown publishes. */
export const ENGLISH_CONSTITUENCY_CODE = 'E14001063';

/** The withheld constituencies of a Wales breakdown of the two above. */
export const WALES_WITHHELD_CONSTITUENCIES = {
  withheld: WALES_CONSTITUENCY_COUNT - PUBLISHED_WELSH_CONSTITUENCY_CODES.length,
  total: WALES_CONSTITUENCY_COUNT,
};

/** Scotland's constituencies in the boundary files. */
export const SCOTLAND_CONSTITUENCY_COUNT = 57;
