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

export interface SampleBill {
  id: string;
  countryId: CountryId;
  jurisdiction: string;
  title: string;
  status: string;
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
];
