import type { TrackedBill } from '@/api/billFeed';

const DECILE_SHARES = {
  gainMore5Pct: 0.2,
  gainLess5Pct: 0.1,
  noChange: 0.7,
  loseLess5Pct: 0,
  loseMore5Pct: 0,
};

export const TRACKED_BILL: TrackedBill = {
  id: 'us-hr1425',
  countryId: 'us',
  jurisdiction: 'US',
  title: 'HR 1425: Child Tax Credit to $5,000',
  status: 'In committee',
  summary: 'Raises the CTC to $5,000 per qualifying child.',
  provisions: [{ path: 'gov.irs.credits.ctc.amount.base[0].amount', value: 5000 }],
  keyFindings: ['External check (cost): within CRFB band.'],
  sourceUrl: 'https://www.congress.gov/bill/119th-congress/house-bill/1425',
  author: 'Rep. Mackenzie, Ryan [R-PA-7]',
  date: '2026-07-06',
  provenance: {
    modelVersion: '1.729.3',
    dataset: 'populace-us',
    datasetVersion: '1.17.0',
    computedAt: '2026-07-09T14:09:18Z',
  },
  validation: {
    fiscalNoteEstimate: -230_000_000_000,
    fiscalNoteUrl: 'https://www.cbo.gov/example',
    peEstimate: -225_500_000_000,
    targetRangeLow: -210_000_000_000,
    targetRangeHigh: -250_000_000_000,
    withinRange: true,
    differencePct: 2,
    discrepancyExplanation: 'The official score assumes a later effective date.',
    externalAnalyses: [
      { source: 'CRFB', url: 'https://www.crfb.org/example', estimate: -220_000_000_000 },
    ],
  },
  impacts: { revenue: -225_500_000_000, povertyPercentChange: -14.3 },
  impactData: {
    budgetary: { stateRevenueImpact: -225_500_000_000, households: 163_000_000 },
    poverty: { baselineRate: 0.169, reformRate: 0.145, percentChange: -14.3 },
    childPoverty: { baselineRate: 0.166, reformRate: 0.099, percentChange: -39.9 },
    winnersLosers: {
      gainMore5Pct: 0.236,
      gainLess5Pct: 0.199,
      noChange: 0.565,
      loseLess5Pct: 0,
      loseMore5Pct: 0,
      byDecile: { 1: DECILE_SHARES, 2: DECILE_SHARES },
    },
    decile: {
      average: { 1: 198.7, 2: 544.3 },
      relative: { 1: 0.0108, 2: 0.0164 },
    },
  },
};
