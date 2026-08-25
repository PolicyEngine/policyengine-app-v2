import { CountryId } from '@/libs/countries';

/**
 * SAMPLE tracker bills — placeholder data demonstrating the native
 * tracker feed and the bill → editable reform bridge. The live feed
 * replaces this when the tracker API is exposed (the Modal tracker app
 * currently has no public JSON endpoint). Every UI surface showing
 * these must label them as sample data.
 */
export interface SampleBillProvision {
  path: string;
  /** Used when the parameter is missing from loaded metadata */
  fallbackBreadcrumb: string;
  proposedValue: number;
}

export type SampleBillStatus = 'Introduced' | 'In committee' | 'Passed chamber' | 'Enacted';

export interface SampleBill {
  id: string;
  countryId: CountryId;
  jurisdiction: string;
  title: string;
  status: SampleBillStatus;
  summary: string;
  provisions: SampleBillProvision[];
}

export const SAMPLE_BILLS: SampleBill[] = [
  {
    id: 'ut-hb-106',
    countryId: 'us',
    jurisdiction: 'Utah',
    title: 'HB 106 — income tax rate reduction',
    status: 'Enacted',
    summary: 'Reduces the individual income tax rate from 4.55% to 4.45%.',
    provisions: [
      {
        path: 'gov.states.ut.tax.income.rate',
        fallbackBreadcrumb: 'Utah → Income tax → Rate',
        proposedValue: 0.0445,
      },
    ],
  },
  {
    id: 'us-ctc-expansion',
    countryId: 'us',
    jurisdiction: 'Federal',
    title: 'Child tax credit expansion proposal',
    status: 'Introduced',
    summary: 'Raises the base child tax credit amount to $2,500 per child.',
    provisions: [
      {
        path: 'gov.irs.credits.ctc.amount.base[0].amount',
        fallbackBreadcrumb: 'IRS → Credits → Child tax credit → Base amount',
        proposedValue: 2500,
      },
    ],
  },
  {
    id: 'us-snap-allotment',
    countryId: 'us',
    jurisdiction: 'Federal',
    title: 'SNAP benefit adjustment proposal',
    status: 'In committee',
    summary: 'Adjusts the SNAP maximum allotment share of the Thrifty Food Plan.',
    provisions: [
      {
        path: 'gov.usda.snap.max_allotment.main.CONTIGUOUS_US.1',
        fallbackBreadcrumb: 'USDA → SNAP → Maximum allotment',
        proposedValue: 350,
      },
    ],
  },
  {
    id: 'wv-sb-392',
    countryId: 'us',
    jurisdiction: 'West Virginia',
    title: 'SB 392 — personal income tax cut',
    status: 'Passed chamber',
    summary: 'Cuts personal income tax rates across all brackets by two percent.',
    provisions: [
      {
        path: 'gov.states.wv.tax.income.rates.single[0].rate',
        fallbackBreadcrumb: 'West Virginia → Income tax → Bottom rate',
        proposedValue: 0.0216,
      },
    ],
  },
  {
    id: 'mo-hb-798',
    countryId: 'us',
    jurisdiction: 'Missouri',
    title: 'HB 798 — top income tax rate reduction',
    status: 'In committee',
    summary: 'Lowers the top individual income tax rate from 4.7% to 4.5%.',
    provisions: [
      {
        path: 'gov.states.mo.tax.income.rates.top',
        fallbackBreadcrumb: 'Missouri → Income tax → Top rate',
        proposedValue: 0.045,
      },
    ],
  },
  {
    id: 'ny-s-277',
    countryId: 'us',
    jurisdiction: 'New York',
    title: 'S 277 — Empire State child credit increase',
    status: 'Introduced',
    summary: 'Raises the Empire State child credit for children under four.',
    provisions: [
      {
        path: 'gov.states.ny.tax.income.credits.ctc.amount.base',
        fallbackBreadcrumb: 'New York → Credits → Empire State child credit → Amount',
        proposedValue: 1000,
      },
    ],
  },
  {
    id: 'uk-pa-restore',
    countryId: 'uk',
    jurisdiction: 'UK Parliament',
    title: 'Personal allowance uprating amendment',
    status: 'Introduced',
    summary: 'Raises the income tax personal allowance to £13,500.',
    provisions: [
      {
        path: 'gov.hmrc.income_tax.allowances.personal_allowance.amount',
        fallbackBreadcrumb: 'HMRC → Income tax → Personal allowance',
        proposedValue: 13500,
      },
    ],
  },
  {
    id: 'uk-two-child-limit',
    countryId: 'uk',
    jurisdiction: 'UK Parliament',
    title: 'Universal credit two-child limit removal',
    status: 'In committee',
    summary: 'Removes the two-child limit on the universal credit child element.',
    provisions: [
      {
        path: 'gov.dwp.universal_credit.elements.child.limit.child_count',
        fallbackBreadcrumb: 'DWP → Universal credit → Child element → Child limit',
        proposedValue: 99,
      },
    ],
  },
];
