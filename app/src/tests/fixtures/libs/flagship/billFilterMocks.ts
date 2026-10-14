import type { TrackedBill } from '@/api/billFeed';

/** Raw tracker statuses, by the stage each one reads as. */
export const ENACTED_STATUSES = [
  'Signed into Law',
  'Enacted',
  'Chaptered',
  'Became law without signature',
  'Public Law 119-21',
  'Veto overridden',
  '  SIGNED INTO LAW  ',
];

export const PROPOSED_STATUSES = [
  'Pre-filed',
  'Prefiled',
  'Introduced',
  'In Committee',
  'Passed Committee',
  'Third Reading',
  'Passed',
  'Passed One Chamber',
  'Passed Both Chambers',
  'Sent to Governor',
  'Sent to President',
  'Awaiting signature',
  'Proposed',
];

export const FAILED_STATUSES = ['Vetoed', 'Pocket veto', 'Dead/Withdrawn', 'Failed', 'Died'];

/** What the feed says when the tracker follows no status for a bill. */
export const UNSET_STATUSES = ['Analyzed', '', undefined, null];

function bill(overrides: Partial<TrackedBill> & Pick<TrackedBill, 'id' | 'status'>): TrackedBill {
  return {
    countryId: 'us',
    jurisdiction: 'Federal',
    title: overrides.id,
    summary: '',
    provisions: [],
    ...overrides,
  };
}

export const FEDERAL_ENACTED = bill({
  id: 'us-hr1',
  jurisdiction: 'US',
  title: 'HR 1: One Big Beautiful Bill Act',
  status: 'Signed into Law',
});

export const FEDERAL_PROPOSED = bill({
  id: 'us-hr1425',
  jurisdiction: 'US',
  title: 'HR 1425: Child Tax Credit to $5,000',
  status: 'In Committee',
});

export const UTAH_ENACTED = bill({
  id: 'ut-hb106',
  jurisdiction: 'Utah',
  state: 'UT',
  title: 'HB 106: income tax rate reduction',
  status: 'Signed into Law',
});

export const UTAH_PROPOSED = bill({
  id: 'ut-hb290',
  jurisdiction: 'Utah',
  state: 'UT',
  title: 'HB 290: Utah child tax credit',
  status: 'Analyzed',
});

export const GEORGIA_VETOED = bill({
  id: 'ga-hb111',
  jurisdiction: 'Georgia',
  state: 'GA',
  title: 'HB 111: Georgia flat tax rate',
  status: 'Vetoed',
});

/** Two federal bills and three state bills across two states and every stage. */
export const FILTER_BILLS: TrackedBill[] = [
  FEDERAL_ENACTED,
  FEDERAL_PROPOSED,
  UTAH_ENACTED,
  UTAH_PROPOSED,
  GEORGIA_VETOED,
];
