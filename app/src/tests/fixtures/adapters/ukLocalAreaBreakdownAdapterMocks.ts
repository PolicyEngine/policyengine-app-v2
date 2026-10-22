import { fromMetadataRegionEntry, type Region } from '@/models/region';
import type { MetadataRegionEntry } from '@/types/metadata';

/** The UK's region list as API v1 metadata gives it, trimmed to a few areas. */
const UK_METADATA_REGION_ENTRIES: MetadataRegionEntry[] = [
  { name: 'uk', label: 'the UK', type: 'national' },
  { name: 'country/scotland', label: 'Scotland', type: 'country' },
  {
    name: 'constituency/East Kilbride and Strathaven',
    label: 'East Kilbride and Strathaven',
    type: 'constituency',
  },
  { name: 'constituency/Aldershot', label: 'Aldershot', type: 'constituency' },
  { name: 'constituency/Aldridge-Brownhills', label: 'Aldridge-Brownhills', type: 'constituency' },
  { name: 'local_authority/Hartlepool', label: 'Hartlepool', type: 'local_authority' },
  { name: 'local_authority/Middlesbrough', label: 'Middlesbrough', type: 'local_authority' },
];

export const UK_METADATA_REGIONS: Region[] = UK_METADATA_REGION_ENTRIES.map((entry) =>
  fromMetadataRegionEntry('uk', entry)
);

export const METADATA_CONSTITUENCY_COUNT = 3;

/** One of the metadata's constituencies, published by a breakdown. */
export const PUBLISHED_CONSTITUENCY_NAMES = ['East Kilbride and Strathaven'];

/** A published name the metadata does not list, so the lists disagree. */
export const UNLISTED_CONSTITUENCY_NAME = 'Ynys Mon';

/** The withheld constituencies a UK-wide breakdown of the fixture's areas leaves. */
export const UK_WIDE_WITHHELD_CONSTITUENCIES = {
  withheld: METADATA_CONSTITUENCY_COUNT - PUBLISHED_CONSTITUENCY_NAMES.length,
  total: METADATA_CONSTITUENCY_COUNT,
};
