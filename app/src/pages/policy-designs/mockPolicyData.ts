import { CURRENT_YEAR } from '@/constants';
import { Policy } from '@/types/ingredients/Policy';

/**
 * Mock policy data using REAL parameter names from the metadata
 * These parameter names actually exist in US_Metadata.json and will show proper labels
 */

export const MOCK_CURRENT_LAW_POLICY: Policy = {
  id: 'current-law-001',
  countryId: 'us',
  label: 'Current Law (2025)',
  parameters: [
    {
      name: 'gov.irs.credits.eitc.max[0].amount',
      values: [
        {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 632,
        },
      ],
    },
    {
      name: 'gov.irs.credits.ctc.amount.base[0].amount',
      values: [
        {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 2200,
        },
      ],
    },
    {
      name: 'gov.irs.income.bracket.rates.1',
      values: [
        {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 0.1,
        },
      ],
    },
  ],
};

export const MOCK_BASELINE_POLICY: Policy = {
  id: 'baseline-001',
  countryId: 'us',
  label: 'Current Law Baseline',
  parameters: [
    {
      name: 'gov.irs.credits.eitc.max[0].amount',
      values: [
        {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 632,
        },
      ],
    },
    {
      name: 'gov.irs.credits.ctc.amount.base[0].amount',
      values: [
        {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 2200,
        },
      ],
    },
    {
      name: 'gov.irs.income.bracket.rates.1',
      values: [
        {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 0.1,
        },
      ],
    },
  ],
};

export const MOCK_REFORM_POLICY: Policy = {
  id: 'reform-001',
  countryId: 'us',
  label: 'Enhanced CTC Reform',
  parameters: [
    {
      name: 'gov.irs.credits.eitc.max[0].amount',
      values: [
        {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 800,
        },
      ],
    },
    {
      name: 'gov.irs.credits.ctc.amount.base[0].amount',
      values: [
        {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 3600,
        },
      ],
    },
    {
      name: 'gov.irs.income.bracket.rates.1',
      values: [
        {
          startDate: `${CURRENT_YEAR}-01-01`,
          endDate: `${CURRENT_YEAR}-12-31`,
          value: 0.08,
        },
      ],
    },
  ],
};
