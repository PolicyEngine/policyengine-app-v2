import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { ScorecardComparisonResults } from '@/components/flagship/ScorecardComparisons';
import {
  jctCtcClaim,
  scorecardClaim,
  stackedJctCtcClaim,
  utahBaselineClaim,
} from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';

describe('scorecard evidence presentation', () => {
  test('given a related reform then shows source-policy counterparts, periods, baseline caveats and no search button', () => {
    render(
      <ScorecardComparisonResults
        result={{
          built: null,
          unmappedCount: 3,
          rows: [{ ...scorecardClaim(), matchBasis: 'parameter' }],
        }}
      />
    );
    expect(screen.getByText(/not a validation of this report/)).toBeInTheDocument();
    expect(screen.getByText('PolicyEngine scorecard estimate')).toBeInTheDocument();
    expect(screen.getByText(/2026 · fiscal year/)).toBeInTheDocument();
    expect(screen.getByText('Different stacking baseline')).toBeInTheDocument();
    expect(screen.getByText(/3 claims in this country/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Find external estimates/ })
    ).not.toBeInTheDocument();
  });
  test('given an expiry-reversal run then explains its policy and different starting baseline', () => {
    render(
      <ScorecardComparisonResults
        result={{
          built: null,
          unmappedCount: 0,
          rows: [{ ...jctCtcClaim, matchBasis: 'parameter' }],
        }}
      />
    );
    expect(screen.getByText(/JCT’s July 2025 Senate bill comparison/)).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '$1,000', hidden: true })).toBeInTheDocument();
    expect(screen.getByText(/broad CTC expansion from an expiry baseline/)).toBeInTheDocument();
  });
  test('given a stacked run then describes that run without applying the expiry-reversal explanation', () => {
    render(
      <ScorecardComparisonResults
        result={{
          built: null,
          unmappedCount: 0,
          rows: [{ ...stackedJctCtcClaim, matchBasis: 'related-policy' }],
        }}
      />
    );
    expect(screen.getByText(/This run adds the CTC changes after/)).toBeInTheDocument();
    expect(screen.queryByText(/This run keeps other enacted tax changes/)).not.toBeInTheDocument();
  });
  test('given a Utah baseline comparison then distinguishes claimed and usable credit', () => {
    render(
      <ScorecardComparisonResults
        result={{
          built: null,
          unmappedCount: 0,
          rows: [{ ...utahBaselineClaim, matchBasis: 'program' }],
        }}
      />
    );
    expect(screen.getByText(/Utah credits claimed before limiting/)).toBeInTheDocument();
    expect(screen.getByText(/Modeled Utah credit actually usable/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
  test('given an undocumented reform then explicitly identifies missing before-and-after rules', () => {
    render(
      <ScorecardComparisonResults
        result={{
          built: null,
          unmappedCount: 0,
          rows: [{ ...scorecardClaim(), matchBasis: 'parameter' }],
        }}
      />
    );
    expect(screen.getByText(/does not supply a complete before-and-after/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
  test('given a reform card then policy details are collapsed until opened', async () => {
    render(
      <ScorecardComparisonResults
        result={{
          built: null,
          unmappedCount: 0,
          rows: [{ ...jctCtcClaim, matchBasis: 'parameter' }],
        }}
      />
    );
    expect(screen.getByRole('table', { hidden: true })).not.toBeVisible();
    await userEvent.click(screen.getByText('Compared policy and baseline'));
    expect(screen.getByRole('table')).toBeVisible();
  });
  test('given an empty feed then absence of matching evidence is explicit', () => {
    render(<ScorecardComparisonResults result={{ built: null, unmappedCount: 0, rows: [] }} />);
    expect(screen.getByText(/No linked reform comparisons/)).toBeInTheDocument();
    expect(
      screen.getByText(/does not establish that no external estimate exists/)
    ).toBeInTheDocument();
  });
});
