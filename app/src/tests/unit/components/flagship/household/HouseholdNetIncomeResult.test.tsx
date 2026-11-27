import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HouseholdNetIncomeResult from '@/components/flagship/household/HouseholdNetIncomeResult';
import type { HouseholdBreakdownSource } from '@/components/flagship/report/household/HouseholdBreakdowns';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  NATIONAL_SPM_CONFIG,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';
import { SPM_RECEIPT } from '@/tests/fixtures/spm/spmMocks';

// The v2 breakdowns, tested on their own: a stand-in names the one shown
// and the policies it compares.
vi.mock('@/components/flagship/report/household/HouseholdBreakdowns', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/flagship/report/household/HouseholdBreakdowns')
  >()),
  default: ({ view, source }: { view: string; source: HouseholdBreakdownSource }) => (
    <div aria-label="Breakdown">{`${view} · ${source.baselinePolicyId} · ${source.reformPolicyId}`}</div>
  ),
}));

/** One policy's run: the breakdowns compare the policy with itself. */
const BASELINE_ONLY_SOURCE: HouseholdBreakdownSource = {
  countryId: 'us',
  year: HOUSEHOLD_YEAR,
  householdId: String(CREATED_HOUSEHOLD_ID),
  baselinePolicyId: BASELINE_POLICY_ID,
  reformPolicyId: BASELINE_POLICY_ID,
  baseline: BASELINE_RESULT,
  reform: BASELINE_RESULT,
  gains: false,
};

const NATIONAL_THRESHOLDS_PROVENANCE = {
  policyengineBundle: null,
  spmConfig: NATIONAL_SPM_CONFIG,
  spmProvenance: SPM_RECEIPT,
};

const SUMMARY = 'Married · 2 children · New York · 2026';

const pointMethodology = () =>
  screen.queryByRole('region', { name: 'SPM point calculation methodology' });

describe('HouseholdNetIncomeResult', () => {
  test('given a US household then its annual net income reads in whole dollars, with who it is for', () => {
    render(
      <HouseholdNetIncomeResult
        netIncome={52300.4}
        summary={SUMMARY}
        countryId="us"
        breakdowns={BASELINE_ONLY_SOURCE}
      />
    );

    expect(screen.getByRole('group', { name: 'Annual net income' })).toHaveTextContent('$52,300');
    expect(screen.getByText(SUMMARY)).toBeInTheDocument();
  });

  test('given a UK household then its net income reads in pounds', () => {
    render(
      <HouseholdNetIncomeResult
        netIncome={25425.55}
        summary="Single · no children · 2026"
        countryId="uk"
        breakdowns={{ ...BASELINE_ONLY_SOURCE, countryId: 'uk' }}
      />
    );

    expect(screen.getByRole('group', { name: 'Annual net income' })).toHaveTextContent('£25,426');
  });

  test('given the result then the net income tree shows first, under the one policy, and no summary is offered', () => {
    render(
      <HouseholdNetIncomeResult
        netIncome={52300}
        summary={SUMMARY}
        countryId="us"
        breakdowns={BASELINE_ONLY_SOURCE}
      />
    );

    const tabs = within(screen.getByRole('tablist', { name: 'Household outputs' }));
    expect(tabs.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Net income',
      'Varying earnings',
      'Marginal tax rates',
    ]);
    expect(tabs.getByRole('tab', { name: 'Net income' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Breakdown')).toHaveTextContent(
      `net-income · ${BASELINE_POLICY_ID} · ${BASELINE_POLICY_ID}`
    );
  });

  test('given SPM provenance then the methodology shows under the net income tree, and not under the variation views', async () => {
    const user = userEvent.setup();
    render(
      <HouseholdNetIncomeResult
        netIncome={52300}
        summary={SUMMARY}
        countryId="us"
        breakdowns={BASELINE_ONLY_SOURCE}
        methodology={NATIONAL_THRESHOLDS_PROVENANCE}
      />
    );
    expect(pointMethodology()).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Varying earnings' }));

    expect(screen.getByLabelText('Breakdown')).toHaveTextContent('earnings-variation');
    expect(pointMethodology()).not.toBeInTheDocument();
  });
});
