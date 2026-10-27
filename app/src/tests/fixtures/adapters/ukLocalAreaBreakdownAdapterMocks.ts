/**
 * A local authority in .py 6.10.0's list and the layout that the Public
 * API's region list names only from PolicyEngine/policyengine-api#4024 on.
 * The withheld counts no longer read that list.
 */
export const ARDS_AND_NORTH_DOWN = 'Ards and North Down';

/**
 * A published local authority name the Public API's region list does not
 * use: it names this one "Kingston upon Hull, City of".
 */
export const UNLISTED_LOCAL_AUTHORITY_NAME = 'Kingston upon Hull';

/** The UK's constituencies and local authorities in the hex layouts. */
export const UK_CONSTITUENCY_COUNT = 650;
export const UK_LOCAL_AUTHORITY_COUNT = 361;

/**
 * The ONS codes of the constituency and the local authority that the
 * breakdown fixture (NORMALIZED_BREAKDOWN) publishes: East Kilbride and
 * Strathaven, in Scotland, and Hartlepool, in England.
 */
export const BREAKDOWN_CONSTITUENCY_CODES = ['S14000021'];
export const BREAKDOWN_LOCAL_AUTHORITY_CODES = ['E06000001'];

/** Ards and North Down's ONS code: in .py 6.10.0's list and the layout. */
export const ARDS_AND_NORTH_DOWN_CODE = 'N09000011';

/** Allerdale's ONS code: a district abolished in April 2023, which the layout lacks. */
export const PRE_2023_LOCAL_AUTHORITY_CODE = 'E07000026';

/** The withheld constituencies of a UK-wide breakdown that publishes one of the 650. */
export const UK_WIDE_WITHHELD_CONSTITUENCIES = {
  withheld: UK_CONSTITUENCY_COUNT - BREAKDOWN_CONSTITUENCY_CODES.length,
  total: UK_CONSTITUENCY_COUNT,
};

/** The withheld local authorities of a UK-wide breakdown that publishes one of the 361. */
export const UK_WIDE_WITHHELD_LOCAL_AUTHORITIES = {
  withheld: UK_LOCAL_AUTHORITY_COUNT - BREAKDOWN_LOCAL_AUTHORITY_CODES.length,
  total: UK_LOCAL_AUTHORITY_COUNT,
};

/** Wales's constituencies and local authorities in the layouts. */
export const WALES_CONSTITUENCY_COUNT = 32;
export const WALES_LOCAL_AUTHORITY_COUNT = 22;

/** Two Welsh constituencies' ONS codes, which a Wales breakdown published. */
export const PUBLISHED_WELSH_CONSTITUENCY_CODES = ['W07000094', 'W07000084'];

/** An English constituency's code, which no Wales breakdown publishes. */
export const ENGLISH_CONSTITUENCY_CODE = 'E14001063';

/** The withheld constituencies of a Wales breakdown of the two above. */
export const WALES_WITHHELD_CONSTITUENCIES = {
  withheld: WALES_CONSTITUENCY_COUNT - PUBLISHED_WELSH_CONSTITUENCY_CODES.length,
  total: WALES_CONSTITUENCY_COUNT,
};

/** Scotland's constituencies in the layout. */
export const SCOTLAND_CONSTITUENCY_COUNT = 57;
