import type { ExploreMetric, ExploreTheme } from './exploreMetrics';

/** A rule that moves a measure, and the words that find it in Build's parameter search. */
export interface ReformLever {
  title: string;
  why: string;
  search: string;
}

const BY_MEASURE: Partial<Record<ExploreMetric['key'], ReformLever[]>> = {
  child_poverty: [
    {
      title: 'Raise the Child Tax Credit',
      why: 'A larger credit reaches most families with children.',
      search: 'child tax credit amount',
    },
    {
      title: 'Make the Child Tax Credit fully refundable',
      why: 'Families with low earnings then get the full credit.',
      search: 'child tax credit refundable',
    },
  ],
  deep_poverty: [
    {
      title: 'Raise the SSI benefit',
      why: 'SSI goes to people with the lowest incomes.',
      search: 'ssi amount',
    },
    {
      title: 'Raise the SNAP maximum benefit',
      why: 'SNAP reaches families with no earnings.',
      search: 'snap maximum allotment',
    },
  ],
};

const BY_THEME: Record<ExploreTheme, ReformLever[]> = {
  poverty: [
    {
      title: 'Make the Child Tax Credit fully refundable',
      why: 'Families with low earnings then get the full credit.',
      search: 'child tax credit refundable',
    },
    {
      title: 'Raise the SNAP maximum benefit',
      why: 'Adds food money for every SNAP household.',
      search: 'snap maximum allotment',
    },
    {
      title: 'Expand the EITC for workers without children',
      why: 'Their credit is small today.',
      search: 'eitc childless',
    },
  ],
  income: [
    {
      title: 'Change the standard deduction',
      why: 'Changes taxable income for most filers.',
      search: 'standard deduction',
    },
    {
      title: 'Change federal income tax rates',
      why: 'Moves income after tax in every bracket.',
      search: 'income tax rates',
    },
  ],
  inequality: [
    {
      title: 'Change the top income tax rate',
      why: 'Acts on the highest incomes only.',
      search: 'top income tax rate',
    },
    {
      title: 'Change the SALT deduction cap',
      why: 'Mostly affects high-income filers who itemize.',
      search: 'salt cap',
    },
    { title: 'Expand the EITC', why: 'Raises incomes at the bottom.', search: 'eitc' },
  ],
  taxes: [
    {
      title: 'Change state income tax rates',
      why: 'Each state sets its own brackets.',
      search: 'state income tax rate',
    },
    {
      title: 'Add or raise a state EITC',
      why: 'A refundable credit lowers the rate at the bottom.',
      search: 'state eitc',
    },
  ],
  benefits: [
    {
      title: 'Change SNAP income limits',
      why: 'Changes who can get SNAP.',
      search: 'snap gross income limit',
    },
    {
      title: 'Change ACA premium tax credit rules',
      why: 'Decides who gets help with premiums.',
      search: 'aca premium tax credit',
    },
    {
      title: 'Change school meal income limits',
      why: 'Decides who gets free meals.',
      search: 'school meals',
    },
  ],
};

/** The rules to offer beside a measure: its own, or its theme's. */
export function leversFor(metric: ExploreMetric): ReformLever[] {
  return BY_MEASURE[metric.key] ?? BY_THEME[metric.theme];
}
