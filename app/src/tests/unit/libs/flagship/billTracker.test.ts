import { describe, expect, test } from 'vitest';
import {
  BILL_TRACKER_URL,
  findTrackedBill,
  processedBillKey,
  researchBillKeys,
  trackerBillTitle,
  trackerBillUrl,
  trackerPlace,
  trackerUrlForBillId,
} from '@/libs/flagship/billTracker';
import {
  FEED_IDS,
  STATE_NAMES_SAMPLE,
  TRACKER_HOME,
  TRACKER_ROWS,
} from '@/tests/fixtures/libs/flagship/billTrackerMocks';

describe('trackerBillUrl', () => {
  test('given the tracker mount then the home is policyengine.org/us/bill-tracker', () => {
    expect(BILL_TRACKER_URL).toBe(TRACKER_HOME);
  });

  test('given a state bill then it links to /{state}/{id}, as the tracker routes it', () => {
    expect(trackerBillUrl(TRACKER_ROWS.STATE_BILL)).toBe(`${TRACKER_HOME}/ks/ks-hb2620`);
  });

  test('given a federal bill then it links under /us', () => {
    expect(trackerBillUrl(TRACKER_ROWS.FEDERAL_BILL)).toBe(`${TRACKER_HOME}/us/us-hr1425`);
    expect(trackerBillUrl(TRACKER_ROWS.LEGACY_FEDERAL_BILL)).toBe(`${TRACKER_HOME}/us/us-hr7024`);
  });

  test('given a row with no bill page then it links to the state page or the home', () => {
    expect(trackerBillUrl(TRACKER_ROWS.UNTYPED_STATE_ROW)).toBe(`${TRACKER_HOME}/ut`);
    expect(trackerBillUrl(TRACKER_ROWS.STATE_BLOG)).toBe(`${TRACKER_HOME}/la`);
    expect(trackerBillUrl(TRACKER_ROWS.IN_REVIEW)).toBe(`${TRACKER_HOME}/ga`);
    expect(trackerBillUrl(TRACKER_ROWS.LEGACY_FEDERAL)).toBe(TRACKER_HOME);
    expect(trackerBillUrl({ id: 'no-state', type: 'bill' })).toBe(TRACKER_HOME);
  });

  test('given an id with URL characters then the id is encoded', () => {
    expect(trackerBillUrl({ id: 'sc-h 3492', state: 'SC', type: 'bill' })).toBe(
      `${TRACKER_HOME}/sc/sc-h%203492`
    );
  });
});

describe('trackerUrlForBillId', () => {
  test('given only an id then the place comes from its prefix', () => {
    expect(trackerUrlForBillId('ks-hb2620')).toBe(`${TRACKER_HOME}/ks/ks-hb2620`);
    expect(trackerUrlForBillId('US-HR1425')).toBe(`${TRACKER_HOME}/us/us-hr1425`);
    expect(trackerUrlForBillId('obbba-explorer')).toBe(TRACKER_HOME);
  });
});

describe('trackerPlace', () => {
  test('given a state code in any case then it reads as the state name', () => {
    expect(trackerPlace('KS', STATE_NAMES_SAMPLE)).toBe('Kansas');
    expect(trackerPlace('dc', STATE_NAMES_SAMPLE)).toBe('District of Columbia');
  });

  test('given the tracker federal codes or none then it reads "Federal"', () => {
    for (const code of ['US', 'all', 'federal', '', undefined, null]) {
      expect(trackerPlace(code, STATE_NAMES_SAMPLE)).toBe('Federal');
    }
  });

  test('given an unknown code then it stays as stored', () => {
    expect(trackerPlace('PR', STATE_NAMES_SAMPLE)).toBe('PR');
  });
});

describe('trackerBillTitle', () => {
  test('given a title then it is the name', () => {
    expect(trackerBillTitle({ id: 'ut-sb60', title: ' UT SB60: rate cut ' })).toBe(
      'UT SB60: rate cut'
    );
  });

  test('given no title then the name is the bill number the id carries', () => {
    expect(trackerBillTitle({ id: 'ut-sb60', title: null })).toBe('SB60');
    expect(trackerBillTitle({ id: 'ga-hb463-2026' })).toBe('HB463-2026');
    expect(trackerBillTitle({ id: 'budget2026' })).toBe('BUDGET2026');
  });
});

describe('processed bill keys', () => {
  test('given spacing, dashes and leading zeros then a bill and its row share a key', () => {
    expect(processedBillKey('UT', 'HB 0210')).toBe('UT:HB210');
    expect(researchBillKeys({ id: 'ut-hb210' })).toEqual(['UT:HB210']);
    expect(researchBillKeys({ id: 'ut-hb-210' })).toEqual(['UT:HB210']);
    expect(researchBillKeys({ id: 'us-hr1425' })).toEqual([processedBillKey('us', 'HR 1425')]);
  });

  test('given a bill number in the title then that key comes first', () => {
    expect(researchBillKeys({ id: 'ga-hb463-2026', title: 'GA HB 463: income tax cut' })).toEqual([
      'GA:HB463',
      'GA:HB4632026',
    ]);
    expect(researchBillKeys({ id: 'sc-h3492', title: 'SC H.3492' })).toEqual(['SC:H3492']);
  });

  test('given an id with no bill number then it has no key', () => {
    expect(researchBillKeys({ id: 'budget2026', title: 'FY2026 budget' })).toEqual([]);
  });
});

describe('findTrackedBill', () => {
  test('given the tracker id then it finds the bill', () => {
    expect(findTrackedBill(FEED_IDS, 'ks-hb2620')).toBe(FEED_IDS[0]);
  });

  test('given the id upper-case or encoded then it finds the same bill', () => {
    expect(findTrackedBill(FEED_IDS, 'KS-HB2620')).toBe(FEED_IDS[0]);
    expect(findTrackedBill(FEED_IDS, 'us%2Dhr1425')).toBe(FEED_IDS[1]);
  });

  test('given an unknown or malformed id then it finds nothing', () => {
    expect(findTrackedBill(FEED_IDS, 'ks-hb9999')).toBeUndefined();
    expect(findTrackedBill(FEED_IDS, '%E0%A4%A')).toBeUndefined();
  });
});
