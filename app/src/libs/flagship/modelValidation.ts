/**
 * Model track record: which scorecard programs a reform touches, and
 * the compact comparison rows the calculator's /api/model-validation
 * route serves for them (PolicyEngine vs external analyses, from the
 * PolicyEngine scorecard).
 */

export interface ModelValidationRow {
  source: string;
  program: string;
  metric: string;
  period: string | null;
  status: 'comparable' | 'constructed';
  unitConcept: string | null;
  externalValue: number;
  peValue: number;
  ratio: number;
  /** True when the dataset was not calibrated to this comparison. */
  heldOut: boolean;
}

export const SCORECARD_URL = 'https://www.policyengine.org/scorecard';

/** Path-token → scorecard program id. Order matters only for labels. */
const PROGRAM_TOKENS: Array<[RegExp, string]> = [
  [/\bsnap\b/, 'snap'],
  [/\bwic\b/, 'wic'],
  [/\btanf\b/, 'tanf'],
  [/\bssi\b/, 'ssi'],
  [/\bliheap\b/, 'liheap'],
  [/\bccdf\b/, 'ccdf'],
  [/\beitc\b|\bearned_income\b/, 'eitc'],
  [/\bctc\b|\bchild_tax_credit\b/, 'ctc_refund'],
  [/\bhud\b|\bhousing\b/, 'housing'],
];

export const PROGRAM_LABELS: Record<string, string> = {
  snap: 'SNAP',
  wic: 'WIC',
  tanf: 'TANF',
  ssi: 'SSI',
  liheap: 'LIHEAP',
  ccdf: 'CCDF',
  eitc: 'EITC',
  ctc_refund: 'Refundable CTC',
  housing: 'Housing assistance',
};

export const METRIC_LABELS: Record<string, string> = {
  eligible_count: 'Eligible people',
  eligibility_rate: 'Eligibility rate',
  participant_count: 'Participants',
  participation_rate: 'Participation rate',
  participation_gap_count: 'Eligible non-participants',
  benefit_total: 'Total benefits',
  average_benefit: 'Average benefit',
};

/** Scorecard programs touched by a set of parameter paths. */
export function scorecardProgramsFromPaths(paths: string[]): string[] {
  const programs = new Set<string>();
  for (const path of paths) {
    const normalized = path.toLowerCase().replace(/[.[\]]/g, ' ');
    for (const [pattern, program] of PROGRAM_TOKENS) {
      if (pattern.test(normalized)) {
        programs.add(program);
      }
    }
  }
  return [...programs];
}

/**
 * Fetches comparison rows for the given programs. Returns null when the
 * route is unavailable (Vite build, scorecard unreachable) so callers
 * can render nothing.
 */
export async function fetchModelValidation(
  programs: string[]
): Promise<ModelValidationRow[] | null> {
  if (programs.length === 0) {
    return null;
  }
  try {
    const response = await fetch(
      `/api/model-validation?programs=${encodeURIComponent(programs.join(','))}`
    );
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    return Array.isArray(payload?.rows) && payload.rows.length > 0 ? payload.rows : null;
  } catch {
    return null;
  }
}

/**
 * The scorecard's claim shape, as our validation lingua franca: every
 * external number — tracker fiscal notes today, scorecard shards, and
 * future sources — normalizes to this row, mirroring the deployed
 * scorecard's data contract (policy-keyed, provenance-carrying).
 */
export interface ValidationClaim {
  /** Source label, e.g. "Official fiscal note", "CRFB", "urban_sotsn" */
  source: string;
  sourceUrl?: string;
  /** The policy the claim scores — bill id for tracker claims */
  policy: string;
  metric: string;
  externalValue: number;
  peValue?: number;
  /** PE ÷ external, when both sides exist */
  ratio?: number;
  notes?: string;
}

/** Tracker validation_metadata → scorecard-shaped claims. */
export function claimsFromBillValidation(
  billId: string,
  validation: {
    fiscalNoteEstimate?: number;
    fiscalNoteUrl?: string;
    peEstimate?: number;
    discrepancyExplanation?: string;
    externalAnalyses?: Array<{ source?: string; url?: string; estimate?: number; notes?: string }>;
  }
): ValidationClaim[] {
  const pe = validation.peEstimate;
  const claim = (
    source: string,
    externalValue: number,
    extra: Partial<ValidationClaim> = {}
  ): ValidationClaim => ({
    source,
    policy: billId,
    metric: 'budgetary_impact',
    externalValue,
    peValue: pe,
    ratio: typeof pe === 'number' && externalValue !== 0 ? pe / externalValue : undefined,
    ...extra,
  });
  return [
    ...(typeof validation.fiscalNoteEstimate === 'number'
      ? [
          claim('Official fiscal note', validation.fiscalNoteEstimate, {
            sourceUrl: validation.fiscalNoteUrl,
            notes: validation.discrepancyExplanation,
          }),
        ]
      : []),
    ...(validation.externalAnalyses ?? [])
      .filter((analysis) => analysis.source && typeof analysis.estimate === 'number')
      .map((analysis) =>
        claim(analysis.source!, analysis.estimate!, {
          sourceUrl: analysis.url,
          notes: analysis.notes,
        })
      ),
  ];
}
