import { fireEvent, render, renderHook, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  differenceNotes,
  RELATED_REFORM_PREVIEW,
  RelatedReformEstimates,
  ScorecardClaimTable,
  splitScorecardRows,
  useScorecardComparisons,
} from '@/components/flagship/ScorecardComparisons';
import { SCORECARD_COMPARISON_URL } from '@/libs/flagship/modelValidation';
import {
  SOI_CDCC_CLAIM,
  UK_PARAMETER_CLAIM,
} from '@/tests/fixtures/libs/flagship/comparisonRelevanceMocks';
import {
  CTC_PATH,
  jctCtcClaim,
  scorecardClaim,
  stackedJctCtcClaim,
  twoChildLimitClaim,
  utahBaselineClaim,
} from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';
import {
  PERSONAL_ALLOWANCE_1PCT,
  ukClaim,
} from '@/tests/fixtures/libs/flagship/signConventionMocks';

describe('scorecard evidence presentation', () => {
  test('given a related reform then shows source-policy counterparts, periods and baseline caveats', () => {
    render(<RelatedReformEstimates rows={[{ ...scorecardClaim(), matchBasis: 'parameter' }]} />);
    expect(screen.getByText(/do not score this exact reform/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show 1 related reform score' }));
    expect(screen.getByRole('columnheader', { name: 'PolicyEngine' })).toBeInTheDocument();
    expect(screen.getByText(/2026 · fiscal year/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'CTC extension' }));
    expect(screen.getByText('Different stacking baseline')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Find external estimates/ })
    ).not.toBeInTheDocument();
  });

  test('given many related reforms then shows computed ones first and the rest on request', async () => {
    const rows = Array.from({ length: RELATED_REFORM_PREVIEW + 2 }, (_, index) => ({
      ...scorecardClaim({
        claim_id: `claim-${index}`,
        name: `Claim ${String(index).padStart(2, '0')}`,
        // Only the last claim has a PolicyEngine value.
        latest: index === RELATED_REFORM_PREVIEW + 1 ? scorecardClaim().latest : null,
      }),
      matchBasis: 'parameter' as const,
    }));
    render(<RelatedReformEstimates rows={rows} />);
    await userEvent.click(
      screen.getByRole('button', {
        name: `Show ${RELATED_REFORM_PREVIEW + 2} related reform scores`,
      })
    );
    const table = screen.getByRole('table', { name: 'Related reforms' });
    const titles = () =>
      within(table)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent);
    expect(titles()).toHaveLength(RELATED_REFORM_PREVIEW);
    expect(titles()[0]).toContain(`Claim ${RELATED_REFORM_PREVIEW + 1}`);
    await userEvent.click(
      screen.getByRole('button', { name: `Show all ${RELATED_REFORM_PREVIEW + 2} related reforms` })
    );
    expect(titles()).toHaveLength(RELATED_REFORM_PREVIEW + 2);
  });

  test('given related reforms then they stay closed until the reader opens them', () => {
    render(<RelatedReformEstimates rows={[{ ...scorecardClaim(), matchBasis: 'parameter' }]} />);

    expect(screen.queryByRole('table', { name: 'Related reforms' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show 1 related reform score' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  test('given a costing with static and post-behavioural legs then one row per year shows, the static one, under the measure name', async () => {
    const rows = [
      twoChildLimitClaim(2026, 'static', 0, 0),
      twoChildLimitClaim(2026, 'post_behavioural', 0, 0),
      twoChildLimitClaim(2027, 'static', -2_055_000_000, -2_308_547_892),
      twoChildLimitClaim(2027, 'post_behavioural', -2_400_000_000, -2_308_547_892),
    ].map((row) => ({ ...row, matchBasis: 'variable' as const }));
    render(<RelatedReformEstimates rows={rows} />);

    await userEvent.click(screen.getByRole('button', { name: 'Show 1 related reform score' }));

    const table = screen.getByRole('table', { name: 'Related reforms' });
    const titles = within(table)
      .getAllByRole('rowheader')
      .map((cell) => cell.textContent);
    expect(titles).toHaveLength(1);
    expect(titles[0]).toContain(
      'Universal Credit Child Element: Remove the two child limit from April 2026'
    );
    expect(within(table).getByText('-£2.1B')).toBeInTheDocument();
    expect(within(table).queryByText(/Different baselines/)).not.toBeInTheDocument();
  });

  test('given only years in which both sides score zero then no related reforms show', () => {
    const rows = [twoChildLimitClaim(2026, 'static', 0, 0)].map((row) => ({
      ...row,
      matchBasis: 'variable' as const,
    }));
    render(<RelatedReformEstimates rows={rows} />);

    expect(screen.queryByText('Related reforms')).not.toBeInTheDocument();
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
    // One row per claim; a claim's notes sit on a line of their own under it.
    expect(within(table).getAllByRole('rowheader')).toHaveLength(2);
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

  test('given a claim then its row links to the scorecard view that lists it', () => {
    render(
      <ScorecardClaimTable
        label="Baseline comparisons"
        entries={[
          { row: { ...SOI_CDCC_CLAIM } },
          { row: { ...UK_PARAMETER_CLAIM } },
          {
            row: { ...SOI_CDCC_CLAIM, claim_id: 'comparison-row', name: 'Comparison row' },
            presentation: { title: 'Comparison row', scorecardUrl: SCORECARD_COMPARISON_URL },
          },
        ]}
      />
    );

    const scorecardLink = (title: string) =>
      within(screen.getByRole('row', { name: new RegExp(`^${title}`) })).getByRole('link', {
        name: 'View in scorecard',
      });
    expect(scorecardLink(SOI_CDCC_CLAIM.name)).toHaveAttribute(
      'href',
      'https://www.policyengine.org/scorecard?view=validation'
    );
    expect(scorecardLink(UK_PARAMETER_CLAIM.name)).toHaveAttribute(
      'href',
      'https://www.policyengine.org/scorecard?view=validation&country=uk'
    );
    expect(scorecardLink('Comparison row')).toHaveAttribute('href', SCORECARD_COMPARISON_URL);
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

  test('given HMRC’s unsigned personal allowance cost then the gap compares magnitudes and says so', () => {
    render(
      <ScorecardClaimTable label="Related reforms" entries={[{ row: PERSONAL_ALLOWANCE_1PCT }]} />
    );

    const cells = within(screen.getByRole('row', { name: /^Change personal allowance by 1%/ }))
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    // The published figure shows as published; the gap is +13.1%, not -213%.
    expect(cells).toEqual(['£1B2026', '-£1.1B', '13.1%']);
    expect(screen.getByText(/The gap compares magnitudes\./)).toBeInTheDocument();
  });

  test('given a source that counts a cost as positive then the gap uses PolicyEngine’s sign', () => {
    const row = ukClaim({
      metric: 'revenue_change',
      convention: 'positive = cost to the Exchequer',
      external: 2e9,
      value: -1.8e9,
    });
    render(<ScorecardClaimTable label="Related reforms" entries={[{ row }]} />);

    const cells = within(screen.getByRole('row', { name: /^UK claim/ }))
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells).toEqual(['£2B2026', '-£1.8B', '10.0%']);
    expect(
      screen.getByText(/the source counts this change with the opposite sign/)
    ).toBeInTheDocument();
  });

  test('given an unclear sign convention then no gap shows and the note says to compare magnitudes', () => {
    const row = ukClaim({ metric: 'gdp_level_effect', convention: 'positive = higher GDP' });
    render(<ScorecardClaimTable label="Related reforms" entries={[{ row }]} />);

    const cells = within(screen.getByRole('row', { name: /^UK claim/ }))
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells[2]).toBe('—');
    expect(
      screen.getByText('The source’s sign convention is unclear; compare the magnitudes.')
    ).toBeInTheDocument();
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

  test('given a UK reform then it sends the scorecard programmes its paths change', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ built: null, rows: [], unmappedCount: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() =>
      useScorecardComparisons('uk', [
        'gov.hmrc.income_tax.allowances.personal_allowance.amount',
        'gov.dwp.universal_credit.elements.child.limit.child_count',
      ])
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables).toEqual([
      'income_tax',
      'universal_credit',
      'universal_credit_child_element',
    ]);
  });

  test('given the feed fails then it resolves to null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })));

    const { result } = renderHook(() => useScorecardComparisons('uk', [CTC_PATH]));

    await waitFor(() => expect(result.current).toBeNull());
  });
});

describe('differenceNotes', () => {
  const related = <T extends object>(claim: T) => ({
    ...claim,
    matchBasis: 'related-policy' as const,
  });

  test('given JCT’s CTC row scored against full current law then baseline and timing notes explain the gap', () => {
    expect(differenceNotes(related(jctCtcClaim))).toEqual([
      expect.stringMatching(
        /^Different baselines: JCT scores this provision after the scheduled TCJA expiry/
      ),
      'Different periods: the source covers fiscal year 2026; PolicyEngine covers calendar year 2026.',
    ]);
  });

  test('given the run stacked where JCT stacks it then no baseline note shows', () => {
    expect(
      differenceNotes(related(stackedJctCtcClaim)).some((note) =>
        note.startsWith('Different baselines')
      )
    ).toBe(false);
  });

  test('given a stacking baseline in the receipt then the generic baseline note shows', () => {
    expect(differenceNotes(related(scorecardClaim()))).toContain(
      'Different baselines: the source and PolicyEngine score the change against different starting policies.'
    );
  });

  test('given a like-for-like comparison then there are no notes', () => {
    expect(
      differenceNotes(
        related(
          scorecardClaim({
            time_basis: 'calendar_year',
            latest: { value: 1, status: 'comparable', annotations: [], construction: '' },
          })
        )
      )
    ).toEqual([]);
  });

  test('given another year and an average month then both differences are named', () => {
    expect(
      differenceNotes(
        related(
          scorecardClaim({ unit_concept: 'persons', latest: { value: 1, status: 'comparable' } })
        ),
        '2023 average month',
        '2024 annual'
      )
    ).toEqual([
      'Different periods: the source covers year 2023; PolicyEngine covers calendar year 2024.',
      'Different measures: the source counts an average month; PolicyEngine counts everyone over the year, which runs higher.',
    ]);
  });
});
