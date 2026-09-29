import { useEffect, useState, type ReactNode } from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import { Stack, Text } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { colors, spacing, typography } from '@/designTokens';
import { SCORECARD_URL } from '@/libs/flagship/modelValidation';
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
  detailStyle,
  EvidenceHeader,
  EvidenceValues,
  linkStyle,
  panelStyle,
  summaryStyle,
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
function modelPeriod(row: RelatedScorecardClaim): string {
  const receipt = [row.latest?.construction, ...(row.latest?.annotations ?? [])].join(' ');
  const years = [...new Set([...receipt.matchAll(/\bCY\s*(20\d{2})/gi)].map((match) => match[1]))];
  return years.length === 1 ? `Calendar year ${years[0]}` : 'Period not recorded separately';
}

function comparisonReason(
  row: RelatedScorecardClaim,
  externalPeriod?: string,
  pePeriod?: string
): string {
  const notes = [row.latest?.construction, ...(row.latest?.annotations ?? [])].join(' ');
  if (row.diagnosis?.title) {
    return 'The source and model measure different concepts; see the explanation below.';
  }
  if (/eligib/.test(row.metric) && /claims.calibrated|claims.shaped/i.test(notes)) {
    return 'PolicyEngine uses a claims-based proxy; the external source estimates eligibility.';
  }
  const baselineDiffers =
    /LAST-IN-STACK|different (?:stacking )?baseline|baseline (?:definitions?|assumptions?) (?:differ|mismatch)/i.test(
      notes
    );
  const calendar = pePeriod ?? modelPeriod(row);
  const fiscal = /fiscal|FY/i.test(externalPeriod ?? claimPeriod(row));
  if (baselineDiffers && fiscal && calendar.startsWith('Calendar year')) {
    return 'Different starting policies and timing: the source uses a fiscal year; PolicyEngine uses a calendar year.';
  }
  if (fiscal && calendar.startsWith('Calendar year')) {
    return `Different timing: the source uses a fiscal year; PolicyEngine uses ${calendar.toLowerCase()}.`;
  }
  if (baselineDiffers) {
    return 'The source and PolicyEngine start from different baseline policies.';
  }
  return 'The scorecard flags this comparison as approximate but does not specify the reason in a structured field. Check the source and calculation notes before interpreting the gap.';
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
              ? `This run adds the CTC changes after the bill’s tax-rate, standard-deduction and personal-exemption changes. Model period: ${modelPeriod(row)}; check the source year below.`
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

export function ScorecardClaimCard({
  row,
  presentation,
  showDetails = false,
}: {
  showDetails?: boolean;
  row: RelatedScorecardClaim;
  presentation?: {
    title: string;
    sourceName?: string;
    externalPeriod?: string;
    modelPeriod?: string;
    externalValue?: string;
    peValue?: string;
  };
}) {
  const latest = row.latest;
  const status = latest?.status_effective ?? latest?.status ?? 'not_computed';
  const sourceName =
    presentation?.sourceName ?? sourceNames[row.source] ?? human(row.source).toUpperCase();
  const sourceUrl = safeUrl(row.url);
  if (!showDetails) {
    const title =
      presentation?.title ??
      (isJctCtc(row) ? 'CTC: $1,000 → $2,200, plus other rule changes' : displayTitle(row.name));
    const published =
      presentation?.externalValue ?? claimValue(row.external_value, row.unit_concept);
    const modeled = presentation?.peValue ?? claimValue(latest?.value, row.unit_concept);
    const gap =
      typeof latest?.value === 'number' &&
      typeof row.external_value === 'number' &&
      row.external_value !== 0
        ? `${(((latest.value - row.external_value) / Math.abs(row.external_value)) * 100).toFixed(1)}%`
        : '—';
    return (
      <div style={{ ...cardStyle, overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: typography.fontSize.sm }}
        >
          <thead>
            <tr>
              {['Comparison', 'Published estimate', 'PolicyEngine estimate', 'Gap'].map((label) => (
                <th
                  key={label}
                  style={{
                    padding: spacing.sm,
                    textAlign: label === 'Comparison' ? 'left' : 'right',
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: `1px solid ${colors.border.light}` }}>
              <td style={{ padding: spacing.sm, width: '40%' }}>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      style={{
                        ...linkStyle,
                        background: 'none',
                        border: 0,
                        padding: 0,
                        font: 'inherit',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      {title}
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
                    <ScorecardClaimCard row={row} presentation={presentation} showDetails />
                  </DialogContent>
                </Dialog>
                <Text style={{ ...detailStyle, margin: 0 }}>
                  {sourceName} · {human(row.geography)}
                </Text>
                {sourceUrl && (
                  <a href={sourceUrl} target="_blank" rel="noreferrer" style={linkStyle}>
                    Read source
                  </a>
                )}
              </td>
              <td style={{ padding: spacing.sm, textAlign: 'right' }}>
                {published}
                <Text style={{ ...detailStyle, margin: 0 }}>
                  {presentation?.externalPeriod ?? claimPeriod(row)}
                </Text>
              </td>
              <td style={{ padding: spacing.sm, textAlign: 'right' }}>
                {modeled}
                <Text style={{ ...detailStyle, margin: 0 }}>
                  {presentation?.modelPeriod ?? modelPeriod(row)}
                </Text>
              </td>
              <td style={{ padding: spacing.sm, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {gap}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <Stack style={cardStyle}>
      <EvidenceHeader
        title={
          presentation?.title ??
          (isJctCtc(row) ? 'CTC: $1,000 → $2,200, plus other rule changes' : displayTitle(row.name))
        }
        subtitle={`${sourceName} · ${human(row.geography)}`}
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
          note: presentation?.externalPeriod ?? claimPeriod(row),
        }}
        right={{
          label:
            row.reform_framework === 'baseline'
              ? 'PolicyEngine estimate'
              : 'PolicyEngine scorecard estimate',
          value: presentation?.peValue ?? claimValue(latest?.value, row.unit_concept),
          note: presentation?.modelPeriod ?? modelPeriod(row),
        }}
      />
      {status === 'constructed' &&
        !isJctCtc(row) &&
        !baselineDescriptions[`${row.source}:${row.source_column}`] && (
          <Text style={{ ...detailStyle, margin: 0 }}>
            {comparisonReason(row, presentation?.externalPeriod, presentation?.modelPeriod)}
          </Text>
        )}
      {row.diagnosis?.title && <Text style={detailStyle}>{row.diagnosis.title}</Text>}
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

export function ScorecardComparisonResults({
  result,
  baselineContent,
  reportContext,
  feedStatus,
}: {
  result: ScorecardComparisonsResult;
  baselineContent?: ReactNode;
  reportContext?: ReactNode;
  feedStatus?: string;
}) {
  const baseline = result.rows.filter((row) => row.reform_framework === 'baseline');
  const reforms = result.rows.filter((row) => row.reform_framework !== 'baseline');
  return (
    <Stack style={{ gap: spacing.lg }}>
      {[
        {
          title: 'Baseline comparisons',
          description: 'How the model compares with published measures of existing programs.',
          rows: baseline,
        },
        {
          title: 'Related reform comparisons',
          description:
            'How PolicyEngine scored other published policy changes. These are not a validation of this report’s exact reform or cost.',
          rows: reforms,
        },
      ].map(({ title, description, rows }) => (
        <Stack key={title} style={panelStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: spacing.md,
            }}
          >
            <Text
              style={{
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.lg,
                margin: 0,
              }}
            >
              {title}
            </Text>
            <a href={SCORECARD_URL} target="_blank" rel="noreferrer" style={linkStyle}>
              View scorecard <IconExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
          {title !== 'Baseline comparisons' && (
            <Text style={{ ...detailStyle, margin: 0 }}>{description}</Text>
          )}
          {title === 'Related reform comparisons' && reportContext}
          {title === 'Baseline comparisons' && baselineContent}
          {feedStatus && <Text style={detailStyle}>{feedStatus}</Text>}
          {rows.length ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr)',
                gap: spacing.md,
                alignItems: 'start',
              }}
            >
              {rows.map((row) => (
                <ScorecardClaimCard key={row.claim_id} row={row} />
              ))}
            </div>
          ) : feedStatus || (title === 'Baseline comparisons' && baselineContent) ? null : (
            <Text style={detailStyle}>
              No linked {title === 'Related reform comparisons' ? 'reform' : 'baseline'} comparisons
              were found in the published scorecard feed.
            </Text>
          )}
        </Stack>
      ))}
      <details style={detailStyle}>
        <summary style={summaryStyle}>Coverage and last update</summary>
        <Text style={detailStyle}>
          Coverage is limited to published claims with a recorded variable, program, parameter path
          or shared source line item.{' '}
          {result.unmappedCount > 0
            ? `${result.unmappedCount} claims in this country have no usable mapping and were not matched. `
            : ''}
          Absence of a match does not establish that no external estimate exists.
          {result.built ? ` Scorecard export: ${result.built}.` : ''}
        </Text>
      </details>
    </Stack>
  );
}

export default function ScorecardComparisons({
  countryId,
  paths,
  baselineContent,
  reportContext,
}: {
  countryId: string;
  paths: string[];
  baselineContent?: ReactNode;
  reportContext?: ReactNode;
}) {
  const requestKey = JSON.stringify({ countryId, paths });
  const [state, setState] = useState<{ key: string; result: ScorecardComparisonsResult | null }>();
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const request = JSON.parse(requestKey) as { countryId: string; paths: string[] };
    if (!request.paths.length) {
      return () => controller.abort();
    }
    (async () => {
      let variables: string[] = [];
      // The committed dependency map is US-only. Never use it for another country.
      if (request.countryId === 'us') {
        try {
          variables = variablesReachedByPaths(request.paths, await loadParameterDependencies()).map(
            (entry) => entry.variable
          );
        } catch {
          /* Recorded parameter paths still allow conservative matching. */
        }
      }
      const response = await fetch('/api/scorecard-comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ country: request.countryId, paths: request.paths, variables }),
      });
      if (!response.ok) {
        throw new Error('Scorecard unavailable');
      }
      const result = (await response.json()) as ScorecardComparisonsResult;
      if (!cancelled) {
        setState({ key: requestKey, result });
      }
    })().catch(() => {
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
    return <Text>No parameter changes are available to match to scorecard comparisons.</Text>;
  }
  const pending = state?.key !== requestKey;
  return (
    <ScorecardComparisonResults
      baselineContent={baselineContent}
      reportContext={reportContext}
      result={
        !pending && state?.result ? state.result : { built: null, rows: [], unmappedCount: 0 }
      }
      feedStatus={
        pending
          ? 'Loading published scorecard comparisons…'
          : state?.result === null
            ? 'The published comparison feed is temporarily unavailable. Existing baseline evidence remains available below.'
            : undefined
      }
    />
  );
}
