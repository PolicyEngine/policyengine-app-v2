import type { TrackerResearchRow } from '@/libs/flagship/billTracker';

/** policyengine.org's mount of the tracker, as tests read it (no VITE_WEBSITE_URL). */
export const TRACKER_HOME = 'https://policyengine.org/us/bill-tracker';

/** Tracker research rows, one per routing case. */
export const TRACKER_ROWS = {
  STATE_BILL: { id: 'ks-hb2620', state: 'KS', type: 'bill', title: 'KS HB 2620' },
  FEDERAL_BILL: { id: 'us-hr1425', state: 'US', type: 'bill', title: 'HR 1425' },
  /** An older federal row filed under "all": the tracker links it under /us by its id. */
  LEGACY_FEDERAL_BILL: { id: 'us-hr7024', state: 'all', type: 'bill', title: 'HR 7024' },
  /** An older federal row with no bill id, which the tracker gives no page. */
  LEGACY_FEDERAL: { id: 'ctc-2026', state: 'all', type: 'bill', title: 'CTC expansion' },
  /** The tracker lists only rows typed "bill" as bills. */
  UNTYPED_STATE_ROW: { id: 'ut-sb60', state: 'UT', title: 'UT SB60' },
  STATE_BLOG: { id: 'la-flat-tax', state: 'LA', type: 'blog', title: 'Louisiana flat tax' },
  IN_REVIEW: { id: 'ga-hb111', state: 'GA', type: 'bill', status: 'in_review', title: 'GA HB 111' },
} satisfies Record<string, TrackerResearchRow>;

export const STATE_NAMES_SAMPLE: Record<string, string> = {
  DC: 'District of Columbia',
  KS: 'Kansas',
  UT: 'Utah',
};

/** Tracked bills as the feed lists them, for id lookups. */
export const FEED_IDS = [{ id: 'ks-hb2620' }, { id: 'us-hr1425' }];
