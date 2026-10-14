import { fireEvent, render, renderHook, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  RelatedReformEstimates,
  ScorecardClaimTable,
  splitScorecardRows,
  useScorecardComparisons,
} from '@/components/flagship/ScorecardComparisons';
import { SOI_CDCC_CLAIM } from '@/tests/fixtures/libs/flagship/comparisonRelevanceMocks';
import {
  CTC_PATH,
  jctCtcClaim,
  scorecardClaim,
  stackedJctCtcClaim,
  utahBaselineClaim,
} from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';

describe('scorecard evidence presentation', () => {
  test('given a related reform then shows source-policy counterparts, periods and baseline caveats', () => {
    render(<RelatedReformEstimates rows={[{ ...scorecardClaim(), matchBasis: 'parameter' }]} />);
    expect(screen.getByText(/do not score this exact reform/)).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'PolicyEngine' })).toBeInTheDocument();
    expect(screen.getByText(/2026 · fiscal year/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Different stacking baseline')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Find external estimates/ })
    ).not.toBeInTheDocument();
  });

  test('given several claims then one table holds them so their numbers line up', () => {
    render(
      <ScorecardClaimTable
        label="Related reforms"
        entries={[
          { row: { ...scorecardClaim(), matchBasis: 'parameter' } },
          { row: { ...stackedJctCtcClaim, claim_id: 'ctc-2027', matchBasis: 'related-policy' } },
        ]}
      />
    );
    const table = screen.getByRole('table', { name: 'Related reforms' });
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent)
    ).toEqual(['Comparison', 'Published', 'PolicyEngine', 'Gap']);
    // A header row and one row per claim.
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getAllByText('-86.9%')).toHaveLength(2);
  });

  test('given an expiry-reversal run then explains its policy and different starting baseline', () => {
    render(
      <ScorecardClaimTable
        label="Related reforms"
        entries={[{ row: { ...jctCtcClaim, matchBasis: 'parameter' } }]}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/JCT’s July 2025 Senate bill comparison/)).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '$1,000', hidden: true })).toBeInTheDocument();
    expect(screen.getByText(/broad CTC expansion from an expiry baseline/)).toBeInTheDocument();
  });

  test('given a stacked run then describes that run without applying the expiry-reversal explanation', () => {
    render(
      <ScorecardClaimTable
        label="Related reforms"
        entries={[{ row: { ...stackedJctCtcClaim, matchBasis: 'related-policy' } }]}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/This run adds the CTC changes after/)).toBeInTheDocument();
    expect(screen.queryByText(/This run keeps other enacted tax changes/)).not.toBeInTheDocument();
  });

  test('given a Utah baseline comparison then distinguishes claimed and usable credit', () => {
    render(
      <ScorecardClaimTable
        label="Baseline comparisons"
        entries={[{ row: { ...utahBaselineClaim, matchBasis: 'program' } }]}
      />
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Utah/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Utah credits claimed before limiting/)).toBeInTheDocument();
    expect(screen.getByText(/Modeled Utah credit actually usable/)).toBeInTheDocument();
  });

  test('given a claim without a recorded model period then none shows under its value', () => {
    render(
      <ScorecardClaimTable label="Baseline comparisons" entries={[{ row: SOI_CDCC_CLAIM }]} />
    );

    const cells = within(screen.getByRole('row', { name: new RegExp(`^${SOI_CDCC_CLAIM.name}`) }))
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells).toEqual(['$3.5BTY2023', '$4.3B', '25.4%']);
    expect(screen.queryByText(/not recorded/i)).not.toBeInTheDocument();
  });

  test('given a receipt that records the calendar year then the period shows under the value', () => {
    render(
      <ScorecardClaimTable
        label="Related reforms"
        entries={[{ row: { ...scorecardClaim(), matchBasis: 'parameter' } }]}
      />
    );

    expect(screen.getByText('Calendar year 2026')).toBeInTheDocument();
  });

  test('given an undocumented reform then explicitly identifies missing before-and-after rules', () => {
    render(
      <ScorecardClaimTable
        label="Related reforms"
        entries={[{ row: { ...scorecardClaim(), matchBasis: 'parameter' } }]}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/does not supply a complete before-and-after/)).toBeInTheDocument();
  });

  test('given a reform row then policy details are collapsed until opened', async () => {
    render(
      <ScorecardClaimTable
        label="Related reforms"
        entries={[{ row: { ...jctCtcClaim, matchBasis: 'parameter' } }]}
      />
    );
    expect(screen.getByRole('table')).toBeVisible();
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Compared policy and baseline'));
    expect(screen.getByRole('table', { name: 'Related reforms', hidden: true })).toBeVisible();
  });
});

describe('splitScorecardRows', () => {
  test('given mixed claims then reform scores and baseline measures come apart', () => {
    const reform = { ...scorecardClaim(), matchBasis: 'parameter' as const };
    const baseline = { ...utahBaselineClaim, matchBasis: 'program' as const };

    expect(splitScorecardRows({ built: null, unmappedCount: 0, rows: [reform, baseline] })).toEqual(
      { reforms: [reform], baseline: [baseline] }
    );
  });

  test('given the feed is loading or unavailable then both lists are empty', () => {
    expect(splitScorecardRows(undefined)).toEqual({ reforms: [], baseline: [] });
    expect(splitScorecardRows(null)).toEqual({ reforms: [], baseline: [] });
  });
});

describe('useScorecardComparisons', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given no parameter paths then it resolves empty without a request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useScorecardComparisons('uk', []));

    expect(result.current).toEqual({ built: null, rows: [], unmappedCount: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given paths then it is loading until the feed answers', async () => {
    const feed = { built: '2026-08-29', rows: [scorecardClaim()], unmappedCount: 2 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(feed)));

    const { result } = renderHook(() => useScorecardComparisons('uk', [CTC_PATH]));

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toEqual(feed));
  });

  test('given the feed fails then it resolves to null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })));

    const { result } = renderHook(() => useScorecardComparisons('uk', [CTC_PATH]));

    await waitFor(() => expect(result.current).toBeNull());
  });
});
