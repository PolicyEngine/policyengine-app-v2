import type { ComponentProps } from 'react';
import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import { compareHouseholds } from '@/libs/flagship/householdRun';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  NATIONAL_SPM_CONFIG,
  REFORM_POLICY_ID,
  REFORM_RESULT,
  UK_BASELINE_RESULT,
  UK_REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';
import { SPM_RECEIPT } from '@/tests/fixtures/spm/spmMocks';

// The v2 breakdowns, tested on their own: a stand-in names the one shown.
vi.mock('@/components/flagship/report/household/HouseholdBreakdowns', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/flagship/report/household/HouseholdBreakdowns')
  >()),
  default: ({ view }: { view: string }) => <div aria-label="Breakdown">{view}</div>,
}));

const UK_IMPACT = compareHouseholds(UK_BASELINE_RESULT, UK_REFORM_RESULT, HOUSEHOLD_YEAR, 'uk');
const UK_SUMMARY = 'Single · no children · £30,000 earnings · 2026';
const US_IMPACT = compareHouseholds(BASELINE_RESULT, REFORM_RESULT, HOUSEHOLD_YEAR, 'us');
const NATIONAL_THRESHOLDS_PROVENANCE = {
  policyengineBundle: null,
  spmConfig: NATIONAL_SPM_CONFIG,
  spmProvenance: SPM_RECEIPT,
};

function renderUSResultWithMethodology() {
  render(
    <HouseholdImpactResult
      impact={US_IMPACT}
      summary="Married · 2 children · New York · 2026"
      countryId="us"
      methodology={{
        baseline: NATIONAL_THRESHOLDS_PROVENANCE,
        reform: NATIONAL_THRESHOLDS_PROVENANCE,
      }}
      breakdowns={{
        countryId: 'us',
        year: HOUSEHOLD_YEAR,
        householdId: String(CREATED_HOUSEHOLD_ID),
        baselinePolicyId: BASELINE_POLICY_ID,
        reformPolicyId: REFORM_POLICY_ID,
        baseline: BASELINE_RESULT,
        reform: REFORM_RESULT,
        gains: true,
      }}
    />
  );
}

const pointMethodology = () =>
  screen.queryByRole('region', { name: 'SPM point calculation methodology' });

describe('HouseholdImpactResult', () => {
  test('given no country then the props do not type-check, so no result reads as the US', () => {
    // @ts-expect-error The household's country is required: it sets the currency.
    const propsWithoutCountry: ComponentProps<typeof HouseholdImpactResult> = {
      impact: UK_IMPACT,
      summary: UK_SUMMARY,
    };

    expect(propsWithoutCountry).not.toHaveProperty('countryId');
  });

  test('given a UK household then its change in net income reads in pounds', () => {
    render(<HouseholdImpactResult impact={UK_IMPACT} summary={UK_SUMMARY} countryId="uk" />);

    expect(screen.getByRole('group', { name: 'Change in annual net income' })).toHaveTextContent(
      '£'
    );
  });

  test('given SPM provenance then the methodology shows under the summary and the net income breakdown', async () => {
    const user = userEvent.setup();
    renderUSResultWithMethodology();

    expect(pointMethodology()).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Net income' }));
    expect(pointMethodology()).toBeInTheDocument();
  });

  test.each(['Varying earnings', 'Marginal tax rates'])(
    'given SPM provenance then %s shows its own variation methodology, not the point calculation',
    async (tabName) => {
      const user = userEvent.setup();
      renderUSResultWithMethodology();

      await user.click(screen.getByRole('tab', { name: tabName }));

      expect(pointMethodology()).not.toBeInTheDocument();
    }
  );
});
