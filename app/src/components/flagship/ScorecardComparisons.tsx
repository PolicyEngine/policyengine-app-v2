import { useEffect, useState } from 'react';
import { IconExternalLink, IconInfoCircle } from '@tabler/icons-react';
import { Stack, Text } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { colors, spacing, typography } from '@/designTokens';
import { scorecardEntryUrl } from '@/libs/flagship/modelValidation';
import {
  loadParameterDependencies,
  variablesReachedByPaths,
} from '@/libs/flagship/parameterDependencies';
import {
  claimPeriod,
  claimValue,
  type RelatedScorecardClaim,
  type ScorecardComparisonsResult,
} from '@/libs/flagship/scorecardComparisons';
import {
  cardStyle,
  CellNote,
  detailStyle,
  EvidenceHeader,
  EvidenceTable,
  EvidenceValues,
  gapText,
  labelCellStyle,
  linkStyle,
  numberCellStyle,
  rowButtonStyle,
  rowStyle,
  summaryStyle,
  ValidationNote,
  ValidationSubheading,
} from './ValidationDisplay';

const matchLabels = {
  variable: 'The reform affects a variable measured by this comparison.',
  parameter: 'Both policies change a shared parameter.',
  program: 'This comparison measures a program affected by the reform.',
  'related-policy': 'Another period of the same published policy comparison.',
};
const human = (text?: string | null) => text?.replaceAll('_', ' ') || 'Not recorded';
const safeUrl = (url?: string) => (url && /^https?:\/\//i.test(url) ? url : undefined);
const sourceNames: Record<string, string> = {
  jct: 'Joint Committee on Taxation',
  irs: 'Internal Revenue Service',
  irs_soi: 'IRS Statistics of Income',
  cbo: 'Congressional Budget Office',
  tpc: 'Tax Policy Center',
  cpsp: 'Center on Poverty and Social Policy',
  pwbm: 'Penn Wharton Budget Model',
  treasury: 'US Treasury',
};
const metricNames: Record<string, string> = {
  revenue_change: 'Change in tax revenue',
  benefit_cost: 'Benefit cost',
  tax_expenditure: 'Tax expenditure',
  poverty_rate: 'Poverty rate',
};
const unitNames: Record<string, string> = {
  usd: 'US dollars',
  gbp: 'British pounds',
  eur: 'euros',
  nzd: 'NZ dollars',
  share: 'share (0–1)',
  persons: 'people',
  tax_units: 'tax units',
};

// Source numbering is retained in the expandable citation, not in the card heading.
function displayTitle(title: string): string {
  const cleaned = title
    .replace(/^\s*\d+\.\s*/, '')
    .replace(/\s*\[\d+(?:\s*[,–-]\s*\d+)*\]/g, '')
    .trim();
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : title;
}
/** The model's period when the receipt records one; null says nothing, so nothing shows. */
function modelPeriod(row: RelatedScorecardClaim): string | null {
  const receipt = [row.latest?.construction, ...(row.latest?.annotations ?? [])].join(' ');
  const years = [...new Set([...receipt.matchAll(/\bCY\s*(20\d{2})/gi)].map((match) => match[1]))];
  return years.length === 1 ? `Calendar year ${years[0]}` : null;
}

/**
 * Why a comparison's two numbers can differ for reasons other than the
 * model: a different baseline, a different period, a different measure.
 * Each is one sentence; none when the comparison is like for like.
 */
export function differenceNotes(
  row: RelatedScorecardClaim,
  externalPeriod?: string,
  pePeriod?: string
): string[] {
  const receipt = [row.latest?.construction, ...(row.latest?.annotations ?? [])].join(' ');
  const status = row.latest?.status_effective ?? row.latest?.status;
  const notes: string[] = [];
  // A run stacked where JCT stacks the provision has JCT's baseline.
  const stackedLikeSource = row.latest?.baseline?.startsWith('obbba_stack_below') ?? false;
  if (isJctCtc(row) && !stackedLikeSource) {
    notes.push(
      'Different baselines: JCT scores this provision after the scheduled TCJA expiry and the bill’s provisions 1–3; PolicyEngine scores it against full current law, so interactions with personal exemptions, AMT and SALT differ.'
    );
  } else if (
    (!isJctCtc(row) &&
      /LAST-IN-STACK|different (?:stacking )?baseline|baseline (?:definitions?|assumptions?) (?:differ|mismatch)/i.test(
        receipt
      )) ||
    (row.claim_baseline &&
      row.latest?.baseline &&
      row.claim_baseline !== row.latest.baseline &&
      row.reform_framework !== 'baseline')
  ) {
    notes.push(
      'Different baselines: the source and PolicyEngine score the change against different starting policies.'
    );
  }
  const published = externalPeriod ?? claimPeriod(row);
  const modelled = pePeriod ?? modelPeriod(row);
  if (/fiscal|FY/i.test(published ?? '') && modelled?.startsWith('Calendar year')) {
    notes.push(
      'Different timing: the source counts a fiscal year; PolicyEngine counts a calendar year.'
    );
  }
  if (row.diagnosis?.title) {
    notes.push(`Different measures: ${row.diagnosis.title}`);
  } else if (/eligib/.test(row.metric) && /claims.calibrated|claims.shaped/i.test(receipt)) {
    notes.push(
      'Different measures: PolicyEngine uses a claims-based proxy; the source estimates eligibility.'
    );
  }
  if (notes.length === 0 && status === 'constructed') {
    notes.push(
      'The scorecard marks this comparison as approximate; read the source and calculation notes before reading the gap.'
    );
  }
  return notes;
}

/** The notes under a comparison: why its numbers can differ, before the gap is read. */
function DifferenceNotes({ notes }: { notes: string[] }) {
  if (notes.length === 0) {
    return null;
  }
  return (
    <div
      style={{
        display: 'flex',
        gap: spacing.sm,
        padding: `${spacing.sm} ${spacing.md}`,
        borderRadius: 8,
        background: colors.gray[50],
        fontSize: typography.fontSize.xs,
        lineHeight: 1.5,
        color: colors.text.secondary,
      }}
    >
      <IconInfoCircle size={14} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {notes.map((note) => (
          <span key={note}>{note}</span>
        ))}
      </div>
    </div>
  );
}

function isJctCtc(row: RelatedScorecardClaim) {
  return (
    row.source === 'jct' &&
    row.conditions?.bill_version === 'JCX-35-25' &&
    row.source_column === '4. Extension and enhancement of increased child tax credit [1]'
  );
}

/** Describe the quantities being compared, including when a definition is missing. */
function ComparisonContext({ row }: { row: RelatedScorecardClaim }) {
  const baseline = row.reform_framework === 'baseline';
  const knownBaseline = baselineDescriptions[`${row.source}:${row.source_column}`];
  const eligibility =
    baseline &&
    /eligible_count|eligibility_rate/.test(row.metric) &&
    /claims.based|claims.calibrated|claims.shaped/i.test(
      [row.latest?.construction, ...(row.latest?.annotations ?? []), row.diagnosis?.title].join(' ')
    );
  const fields =
    knownBaseline ??
    (eligibility
      ? [
          [
            'Published measure',
            row.metric === 'eligible_count'
              ? 'Tax units estimated to be eligible for the credit.'
              : 'Share of tax units estimated to be eligible for the credit.',
          ],
          [
            'Model measure',
            'A claims-based proxy for eligibility. Claiming a credit and being eligible for it are different measures.',
          ],
        ]
      : baseline
        ? [
            [
              'Published measure',
              `${displayTitle(row.name)} · ${metricNames[row.metric] ?? human(row.metric)}.`,
            ],
            [
              'Model measure',
              'The scorecard does not provide a plain-language definition of the model measure. See calculation details before treating the values as equivalent.',
            ],
          ]
        : [
            ['Compared reform', displayTitle(row.conditions?.provision ?? row.name)],
            [
              'Before → after',
              'The scorecard does not supply a complete before-and-after policy definition for this comparison.',
            ],
            [
              'Use this comparison',
              'Related evidence only; an exact match to your reform has not been established.',
            ],
          ]);
  if (isJctCtc(row)) {
    const period = modelPeriod(row);
    const reversed = row.latest?.construction?.includes('scored as expiry reversal');
    const stacked =
      row.latest?.baseline === 'obbba_stack_below__jcx_producer__obbba_child_tax_credit';
    return (
      <Stack style={{ gap: spacing.sm }}>
        <Text style={{ ...detailStyle, margin: 0 }}>
          JCT’s July 2025 Senate bill comparison: scheduled expiry → permanent expanded credit.
        </Text>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...detailStyle }}>
            <caption
              style={{
                textAlign: 'left',
                fontWeight: typography.fontWeight.semibold,
                paddingBottom: spacing.sm,
              }}
            >
              What changes in the compared reform
            </caption>
            <thead>
              <tr>
                {['Rule', 'Before: scheduled expiry', 'After: Senate bill'].map((label) => (
                  <th key={label} scope="col" style={{ textAlign: 'left', padding: spacing.sm }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Maximum credit per child', '$1,000', '$2,200; indexed after 2025'],
                ['Credit for other dependents', '$0', '$500'],
                [
                  'Income where credit starts shrinking',
                  '$75,000 single / $110,000 joint',
                  '$200,000 single / $400,000 joint',
                ],
                ['Earnings needed before refund begins', '$3,000', '$2,500'],
              ].map(([rule, before, after]) => (
                <tr key={rule}>
                  {[rule, before, after].map((value, index) => (
                    <td
                      key={index}
                      style={{ padding: spacing.sm, borderTop: `1px solid ${colors.border.light}` }}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Text style={{ ...detailStyle, margin: 0 }}>
          Also retains a higher, inflation-adjusted refundable cap and requires a qualifying Social
          Security number for the taxpayer (at least one spouse on a joint return) and child.
        </Text>
        <a
          href="https://www.congress.gov/bill/119th-congress/house-bill/1/text/eas"
          target="_blank"
          rel="noreferrer"
          style={linkStyle}
        >
          Read bill text · section 70104 <IconExternalLink size={16} aria-hidden="true" />
        </a>
        <Text style={{ ...detailStyle, margin: 0 }}>
          <strong>Use this comparison:</strong> It tests a broad CTC expansion from an expiry
          baseline. It does not isolate a further increase in the credit amount under today’s law.
        </Text>
        <Text style={{ ...detailStyle, margin: 0 }}>
          <strong>Model baseline:</strong>{' '}
          {reversed
            ? 'This run keeps other enacted tax changes in place while reversing the CTC expiry. JCT starts with only the bill’s tax-rate, standard-deduction and personal-exemption changes applied. Those different tax rules affect how much CTC families can receive.'
            : stacked
              ? `This run adds the CTC changes after the bill’s tax-rate, standard-deduction and personal-exemption changes.${period ? ` Model period: ${period}; check the source year below.` : ''}`
              : 'The stored calculation does not provide enough detail to confirm the starting tax rules.'}
        </Text>
      </Stack>
    );
  }
  return (
    <dl style={{ margin: 0, display: 'grid', gap: spacing.sm }}>
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt style={{ ...detailStyle, margin: 0, fontWeight: typography.fontWeight.semibold }}>
            {label}
          </dt>
          <dd style={{ ...detailStyle, margin: 0 }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// Source-specific definitions from the published scorecard receipts. Never apply
// these to another source merely because it measures the same program.
const baselineDescriptions: Record<string, string[][]> = {
  'irs_soi:soi_ctc_refundable': [
    [
      'Published measure',
      'Total refundable Child Tax Credit reported on tax returns: the portion paid beyond income tax owed.',
    ],
    ['Model measure', 'Total modeled refundable Child Tax Credit.'],
  ],
  'irs_soi:soi_ctc_nonrefundable': [
    [
      'Published measure',
      'Child Tax Credit plus Credit for Other Dependents used to reduce income tax, excluding refundable payments.',
    ],
    [
      'Model measure',
      'Total modeled nonrefundable Child Tax Credit, including the other-dependent credit.',
    ],
  ],
  'jct:te_ctc': [
    [
      'Published measure',
      'Federal cost of the Child Tax Credit and Credit for Other Dependents, including refundable payments.',
    ],
    ['Model measure', 'Change in income tax when the model removes those credits.'],
  ],
  'id_admin:state_id_ctc': [
    [
      'Published measure',
      'Idaho’s estimated revenue forgone from its $205-per-child credit. This is a state budget estimate, not observed tax receipts.',
    ],
    [
      'Model measure',
      'Total modeled Idaho Child Tax Credit. The credit can reduce tax owed but cannot create a refund.',
    ],
  ],
  'ut_admin:state_ut_ctc': [
    [
      'Published measure',
      'Utah credits claimed before limiting them to the income tax a family owes.',
    ],
    ['Model measure', 'Modeled Utah credit actually usable against income tax.'],
    [
      'Use this comparison',
      'These are different quantities. A family can claim more credit than it can use; the gap is not a like-for-like accuracy test.',
    ],
  ],
};

/** How a claim reads in its row and dialog, when the caller words it better than the claim. */
export interface ClaimPresentation {
  title: string;
  sourceName?: string;
  externalPeriod?: string;
  modelPeriod?: string;
  externalValue?: string;
  peValue?: string;
  /** Where the claim sits on the scorecard, when not its registry of published claims. */
  scorecardUrl?: string;
}

/** A scorecard claim, and how to present it. */
export interface ScorecardClaimEntry {
  row: RelatedScorecardClaim;
  presentation?: ClaimPresentation;
}

function claimTitle(row: RelatedScorecardClaim, presentation?: ClaimPresentation): string {
  return (
    presentation?.title ??
    (isJctCtc(row) ? 'CTC: $1,000 → $2,200, plus other rule changes' : displayTitle(row.name))
  );
}

/** The claim's own place on the scorecard, as close as the scorecard's links reach. */
function claimScorecardUrl(row: RelatedScorecardClaim, presentation?: ClaimPresentation): string {
  return presentation?.scorecardUrl ?? scorecardEntryUrl('validation', row.country);
}

/** The source, and the geography when the claim records one: "Joint Committee on Taxation · US". */
function claimWhere(row: RelatedScorecardClaim, presentation?: ClaimPresentation): string {
  const sourceName =
    presentation?.sourceName ?? sourceNames[row.source] ?? human(row.source).toUpperCase();
  return [sourceName, row.geography && human(row.geography)].filter(Boolean).join(' · ');
}

/** Everything the scorecard records about one claim, for its detail dialog. */
export function ScorecardClaimDetails({ row, presentation }: ScorecardClaimEntry) {
  const latest = row.latest;
  const status = latest?.status_effective ?? latest?.status ?? 'not_computed';
  const sourceUrl = safeUrl(row.url);

  return (
    <Stack style={cardStyle}>
      <EvidenceHeader
        title={claimTitle(row, presentation)}
        subtitle={claimWhere(row, presentation)}
        href={sourceUrl}
      />
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
        <Text style={{ ...detailStyle, margin: 0 }}>
          {metricNames[row.metric] ?? human(row.metric)} ·{' '}
          {unitNames[row.unit_concept] ?? human(row.unit_concept)}
        </Text>
        <span
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            background: colors.gray[100],
            borderRadius: spacing.radius.chip,
            padding: `${spacing.xs} ${spacing.sm}`,
          }}
        >
          {status === 'constructed'
            ? row.reform_framework === 'baseline'
              ? 'Check definitions and years'
              : 'Related reform · not an exact match'
            : status === 'comparable'
              ? 'Comparable measures'
              : status === 'concept_mismatch'
                ? 'Different quantities'
                : human(status)}
        </span>
      </div>
      <EvidenceValues
        left={{
          label: 'Published estimate',
          value: presentation?.externalValue ?? claimValue(row.external_value, row.unit_concept),
          note: presentation?.externalPeriod ?? (claimPeriod(row) || undefined),
        }}
        right={{
          label:
            row.reform_framework === 'baseline'
              ? 'PolicyEngine estimate'
              : 'PolicyEngine scorecard estimate',
          value: presentation?.peValue ?? claimValue(latest?.value, row.unit_concept),
          note: presentation?.modelPeriod ?? modelPeriod(row) ?? undefined,
        }}
      />
      <DifferenceNotes
        notes={differenceNotes(row, presentation?.externalPeriod, presentation?.modelPeriod)}
      />
      <details style={detailStyle}>
        <summary style={summaryStyle}>
          {row.reform_framework === 'baseline'
            ? 'What these figures measure'
            : 'Compared policy and baseline'}
        </summary>
        <Stack style={{ gap: spacing.sm, paddingTop: spacing.sm }}>
          <ComparisonContext row={row} />
          {row.metric === 'revenue_change' && (
            <Text style={{ ...detailStyle, margin: 0 }}>
              Negative amounts mean lower tax revenue. Both figures refer to the scorecard’s
              compared policy, not this report’s reform.
            </Text>
          )}

          <Text style={detailStyle}>
            {matchLabels[row.matchBasis]} The PolicyEngine estimate is the scorecard’s stored
            calculation for this published policy.
          </Text>
          {status === 'constructed' && (
            <Text style={detailStyle}>
              The scorecard marks this as an approximation. Definitions, timing or baseline
              assumptions differ; the gap should not be read as a model error on its own.
            </Text>
          )}
          {latest?.annotations?.length ? (
            <ul style={{ margin: 0, paddingLeft: spacing.xl }}>
              {latest.annotations.map((note, index) => (
                <li key={`${index}-${note}`}>{note}</li>
              ))}
            </ul>
          ) : null}
          <Text style={detailStyle}>
            {row.calibration_relationship === 'held_out'
              ? 'This comparison was not used to calibrate the dataset.'
              : row.calibration_relationship === 'consumed_as_target'
                ? 'Related measures were used to calibrate the dataset, so this is not an independent holdout test.'
                : `Calibration relationship: ${human(row.calibration_relationship)}.`}
          </Text>
          <Text style={detailStyle}>
            Source baseline: {human(row.claim_baseline)}. PolicyEngine baseline:{' '}
            {human(latest?.baseline)}.
          </Text>
          <details>
            <summary style={summaryStyle}>Full source citation and calculation details</summary>
            <Stack style={{ gap: spacing.sm }}>
              <Text style={detailStyle}>{row.publication_title ?? row.name}</Text>
              <Text style={detailStyle}>Original source line: {row.name}</Text>
              {/\[\d+\]/.test(row.name) && (
                <Text style={detailStyle}>
                  Bracketed numbers are footnote references in the original publication. Follow the
                  source link to read them.
                </Text>
              )}
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noreferrer" style={linkStyle}>
                  Open original publication <IconExternalLink size={16} aria-hidden="true" />
                </a>
              )}
              <Text style={detailStyle}>
                {latest?.construction || 'No computation method recorded.'}
              </Text>
              <Text style={detailStyle}>
                Model: {latest?.engine_version ?? 'not recorded'} · Computed:{' '}
                {latest?.computed_at ?? 'not recorded'}
              </Text>
              <Text style={detailStyle}>Data: {latest?.data_bundle ?? 'not recorded'}</Text>
            </Stack>
          </details>
        </Stack>
      </details>
    </Stack>
  );
}

/** One claim as a table row: what is compared, both values, and the gap. */
function ScorecardClaimRow({ row, presentation }: ScorecardClaimEntry) {
  const sourceUrl = safeUrl(row.url);
  const smallLink = { ...linkStyle, fontSize: typography.fontSize.xs };
  // Only a period that is recorded; "not recorded" under every value says nothing.
  const publishedNote = presentation?.externalPeriod ?? claimPeriod(row);
  const peNote = presentation?.modelPeriod ?? modelPeriod(row);
  const notes = differenceNotes(row, presentation?.externalPeriod, presentation?.modelPeriod);
  return (
    <>
      <tr style={rowStyle}>
        <th scope="row" style={labelCellStyle}>
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" style={rowButtonStyle}>
                {claimTitle(row, presentation)}
              </button>
            </DialogTrigger>
            <DialogContent
              aria-describedby={undefined}
              style={{ maxWidth: 720, maxHeight: '85dvh', overflowY: 'auto' }}
            >
              <DialogTitle>
                {row.reform_framework === 'baseline'
                  ? 'Baseline comparison'
                  : 'Related reform comparison'}
              </DialogTitle>
              <ScorecardClaimDetails row={row} presentation={presentation} />
            </DialogContent>
          </Dialog>
          <CellNote>{claimWhere(row, presentation)}</CellNote>
          <CellNote>
            {sourceUrl && (
              <>
                <a href={sourceUrl} target="_blank" rel="noreferrer" style={smallLink}>
                  Read source
                </a>
                {' · '}
              </>
            )}
            <a
              href={claimScorecardUrl(row, presentation)}
              target="_blank"
              rel="noreferrer"
              style={smallLink}
            >
              View in scorecard
            </a>
          </CellNote>
        </th>
        <td style={numberCellStyle}>
          {presentation?.externalValue ?? claimValue(row.external_value, row.unit_concept)}
          {publishedNote && <CellNote>{publishedNote}</CellNote>}
        </td>
        <td style={numberCellStyle}>
          {presentation?.peValue ?? claimValue(row.latest?.value, row.unit_concept)}
          {peNote && <CellNote>{peNote}</CellNote>}
        </td>
        <td style={numberCellStyle}>{gapText(row.latest?.value, row.external_value)}</td>
      </tr>
      {notes.length > 0 && (
        // Under the row it explains, across all four columns.
        <tr>
          <td colSpan={4} style={{ padding: `0 0 ${spacing.md}` }}>
            <DifferenceNotes notes={notes} />
          </td>
        </tr>
      )}
    </>
  );
}

/** Scorecard claims in one table, so their numbers line up. Each title opens its details. */
export function ScorecardClaimTable({
  label,
  entries,
}: {
  label: string;
  entries: ScorecardClaimEntry[];
}) {
  return (
    <EvidenceTable label={label} columns={['Comparison', 'Published', 'PolicyEngine', 'Gap']}>
      {entries.map((entry) => (
        <ScorecardClaimRow
          key={entry.row.claim_id}
          row={entry.row}
          presentation={entry.presentation}
        />
      ))}
    </EvidenceTable>
  );
}

/** Published scorecard estimates of other policies that change the same rules. */
export function RelatedReformEstimates({ rows }: { rows: RelatedScorecardClaim[] }) {
  return (
    <Stack style={{ gap: spacing.sm }}>
      <ValidationSubheading>Related reforms</ValidationSubheading>
      <ValidationNote>
        Published scores of policies that change the same rules. They do not score this exact
        reform.
      </ValidationNote>
      <ScorecardClaimTable label="Related reforms" entries={rows.map((row) => ({ row }))} />
    </Stack>
  );
}

/** What the scorecard match covers, collapsed. */
export function ScorecardCoverage({ result }: { result: ScorecardComparisonsResult }) {
  return (
    <details style={detailStyle}>
      <summary style={summaryStyle}>Coverage</summary>
      <Text style={detailStyle}>
        Matches cover scorecard claims with a recorded variable, program, parameter path or source
        line item.
        {result.unmappedCount > 0
          ? ` ${result.unmappedCount} claims in this country have no usable mapping.`
          : ''}
        {result.built ? ` Scorecard export: ${result.built}.` : ''}
      </Text>
    </details>
  );
}

/**
 * The published scorecard claims linked to a reform: `undefined` while
 * loading, `null` when the feed is unavailable.
 */
export type ScorecardComparisonsState = ScorecardComparisonsResult | null | undefined;

const NO_COMPARISONS: ScorecardComparisonsResult = { built: null, rows: [], unmappedCount: 0 };

/** The claims that score a policy change, apart from those that measure today's programs. */
export function splitScorecardRows(result: ScorecardComparisonsState): {
  reforms: RelatedScorecardClaim[];
  baseline: RelatedScorecardClaim[];
} {
  const rows = result?.rows ?? [];
  return {
    reforms: rows.filter((row) => row.reform_framework !== 'baseline'),
    baseline: rows.filter((row) => row.reform_framework === 'baseline'),
  };
}

async function fetchScorecardComparisons(
  countryId: string,
  paths: string[],
  signal: AbortSignal
): Promise<ScorecardComparisonsResult> {
  let variables: string[] = [];
  // The committed dependency map is US-only. Never use it for another country.
  if (countryId === 'us') {
    try {
      variables = variablesReachedByPaths(paths, await loadParameterDependencies()).map(
        (entry) => entry.variable
      );
    } catch {
      /* Recorded parameter paths still allow conservative matching. */
    }
  }
  const response = await fetch('/api/scorecard-comparisons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ country: countryId, paths, variables }),
  });
  if (!response.ok) {
    throw new Error('Scorecard unavailable');
  }
  return (await response.json()) as ScorecardComparisonsResult;
}

/** Fetches the published scorecard claims linked to a reform's parameter paths. */
export function useScorecardComparisons(
  countryId: string,
  paths: string[]
): ScorecardComparisonsState {
  const requestKey = JSON.stringify({ countryId, paths });
  const [state, setState] = useState<{ key: string; result: ScorecardComparisonsResult | null }>();
  useEffect(() => {
    const request = JSON.parse(requestKey) as { countryId: string; paths: string[] };
    if (!request.paths.length) {
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    fetchScorecardComparisons(request.countryId, request.paths, controller.signal)
      .then((result) => {
        if (!cancelled) {
          setState({ key: requestKey, result });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ key: requestKey, result: null });
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [requestKey]);
  if (!paths.length) {
    return NO_COMPARISONS;
  }
  return state?.key === requestKey ? state.result : undefined;
}
