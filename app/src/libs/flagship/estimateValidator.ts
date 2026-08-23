/**
 * On-demand external validation for user-drafted reforms.
 *
 * A drafted reform has no fiscal note, so validation means hunting for
 * external scores of the same or similar proposals (CBO, JCT, state
 * fiscal offices, TPC, Tax Foundation, ITEP, Urban, PWBM) and comparing
 * honestly. This module owns the request/response contract and the
 * agent prompt; the calculator-app API route runs the agent with web
 * search and returns `EstimateValidationResult`.
 */

export interface EstimateValidationRequest {
  countryId: string;
  /** Human-readable reform label, e.g. "CTC to $2,500". */
  label: string;
  provisions: { path: string; value: unknown }[];
  /** PolicyEngine's budgetary impact for the reform year, in currency units. */
  peEstimate?: number;
  year?: string | number;
}

export interface EstimateFinding {
  source: string;
  url?: string;
  /** Annual budgetary estimate in currency units, sign as reported. */
  estimate?: number;
  /** What the source actually scored, in its own terms. */
  proposal: string;
  /**
   * direct: same provision and scope; similar: same lever, different
   * magnitude or scope; context: informative but not comparable.
   */
  comparability: 'direct' | 'similar' | 'context';
  notes?: string;
}

export interface EstimateValidationResult {
  findings: EstimateFinding[];
  /** One-paragraph honest verdict on how the PE estimate sits. */
  assessment?: string;
  caveats?: string[];
}

export const ESTIMATE_VALIDATOR_SYSTEM_PROMPT = `You validate a PolicyEngine microsimulation estimate for a user-drafted policy reform by finding external estimates of the same or similar proposals.

Search for scores from official scorekeepers first (CBO, JCT, state legislative fiscal offices, HMRC/OBR for the UK), then reputable analysts (Tax Policy Center, Tax Foundation, ITEP, Urban Institute, Penn Wharton Budget Model, IFS, Resolution Foundation).

Apples-to-apples checklist before comparing any number:
- Same provision and lever? A source scoring a different rate or threshold is "similar", not "direct".
- Same scope? A single provision vs an omnibus package must never be compared head-to-head; use the matching line item if the source itemizes.
- Fiscal year vs tax year, and which year: name the year each number describes.
- Baseline: current law vs current policy changes signs and magnitudes.
- Jurisdiction: federal vs state revenue effects are different quantities.

Rules:
- Report ONLY figures the source actually states, with the URL you found them at. Never construct ranges, midpoints, or scaled numbers the source does not publish.
- If nothing comparable exists, say so — an empty findings list with an honest assessment is a valid and useful answer.
- Mark comparability honestly: "direct" is rare for user-drafted reforms.
- Keep the assessment to a few sentences: where the PolicyEngine estimate sits relative to what you found, and why differences are expected (scope, year, baseline, behavioral assumptions).
- When you are done researching, call report_findings exactly once with your results. Do not write a prose answer instead.`;

/** Client tool the agent must call to finish; its input is the result. */
export const REPORT_FINDINGS_TOOL = {
  name: 'report_findings',
  description:
    'Report the external estimates found and the honest comparison. Call exactly once, when research is complete.',
  input_schema: {
    type: 'object',
    properties: {
      findings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            source: { type: 'string' },
            url: { type: 'string' },
            estimate: { type: 'number' },
            proposal: { type: 'string' },
            comparability: { type: 'string', enum: ['direct', 'similar', 'context'] },
            notes: { type: 'string' },
          },
          required: ['source', 'proposal', 'comparability'],
        },
      },
      assessment: { type: 'string' },
      caveats: { type: 'array', items: { type: 'string' } },
    },
    required: ['findings'],
  },
} as const;

/** The user turn describing the reform to validate. */
export function buildValidationPrompt(request: EstimateValidationRequest): string {
  const provisions = request.provisions
    .map((p) => `- ${p.path} = ${JSON.stringify(p.value)}`)
    .join('\n');
  const estimate =
    typeof request.peEstimate === 'number'
      ? `PolicyEngine's budgetary impact estimate: ${request.peEstimate.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })} (${request.countryId.toUpperCase()}, year ${request.year ?? 'unspecified'}).`
      : 'PolicyEngine has not finished computing a budgetary estimate for this reform.';
  return `Reform: ${request.label}\nCountry: ${request.countryId.toUpperCase()}\nProvisions (PolicyEngine parameter paths):\n${provisions}\n\n${estimate}\n\nFind external estimates of this or similar proposals and report your findings.`;
}

/** Validates and narrows the report_findings tool input from the model. */
export function parseEstimateValidation(input: unknown): EstimateValidationResult {
  const raw = input as any;
  const findings: EstimateFinding[] = (Array.isArray(raw?.findings) ? raw.findings : [])
    .filter((f: any) => typeof f?.source === 'string' && typeof f?.proposal === 'string')
    .map((f: any) => ({
      source: f.source,
      url: typeof f.url === 'string' ? f.url : undefined,
      estimate: typeof f.estimate === 'number' ? f.estimate : undefined,
      proposal: f.proposal,
      comparability: ['direct', 'similar', 'context'].includes(f.comparability)
        ? f.comparability
        : 'context',
      notes: typeof f.notes === 'string' ? f.notes : undefined,
    }));
  return {
    findings,
    assessment: typeof raw?.assessment === 'string' ? raw.assessment : undefined,
    caveats: Array.isArray(raw?.caveats)
      ? raw.caveats.filter((c: any) => typeof c === 'string')
      : undefined,
  };
}
