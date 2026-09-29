import type { AskAgentToolCall, AskAgentUsage } from '@/libs/flagship/usAskLoop';

/**
 * Grading for the Ask agent's drafting evaluation. Each case is a bill the
 * legislative tracker has modelled: the agent is given the bill as a user
 * would paste it, and its drafted reform (the last reform it validated) is
 * compared with the parameter values an analyst actually set.
 */

export type ReformValue = number | boolean;

export interface AskAgentEvalCase {
  id: string;
  title: string;
  description: string;
  /** Two-letter state for state bills; null for federal ones. */
  state: string | null;
  /** Parameter path to the value the tracker's reform sets. */
  expected: Record<string, ReformValue>;
  /** Every expected path is a contributed (gov.contrib) parameter. */
  contrib: boolean;
  /** The tracker reform changes some value over more than one period. */
  multiPeriod: boolean;
}

export interface ProposedReform {
  reform: Record<string, unknown>;
  /** The agent's own validate_reform call accepted this reform. */
  validated: boolean;
}

export interface AskAgentCaseGrade {
  expectedPaths: number;
  proposedPaths: number;
  pathsFound: number;
  valuesCorrect: number;
  /** Every expected path is present with the expected value. */
  allCorrect: boolean;
  /** allCorrect, and nothing else was changed. */
  exact: boolean;
}

export interface AskAgentCaseResult {
  id: string;
  contrib: boolean;
  expectedPaths: number;
  grade: AskAgentCaseGrade;
  validated: boolean;
  usage: AskAgentUsage;
  costUsd: number;
  latencyMs: number;
  stopReason: string;
  /** The drafted reform, kept for reading misses. */
  proposed?: Record<string, unknown> | null;
  judge?: { verdict: JudgeVerdict; reason: string };
  /** What the judge call cost, kept apart from the agent's cost. */
  judgeCostUsd?: number;
  error?: string;
}

/** The last reform the agent validated successfully, else the last one it tried. */
export function extractProposedReform(toolCalls: AskAgentToolCall[]): ProposedReform | null {
  const attempts = toolCalls.filter((call) => call.name === 'validate_reform');
  for (let i = attempts.length - 1; i >= 0; i--) {
    const call = attempts[i];
    let valid = false;
    try {
      valid = JSON.parse(call.output)?.valid === true;
    } catch {
      valid = false;
    }
    if (valid && !call.isError) {
      return { reform: reformOf(call.input), validated: true };
    }
  }
  const last = attempts[attempts.length - 1];
  return last ? { reform: reformOf(last.input), validated: false } : null;
}

function reformOf(input: unknown): Record<string, unknown> {
  const reform = (input as { reform?: unknown } | null)?.reform;
  return reform && typeof reform === 'object' && !Array.isArray(reform)
    ? (reform as Record<string, unknown>)
    : {};
}

export function sameReformValue(expected: ReformValue, proposed: unknown): boolean {
  if (typeof expected === 'boolean') {
    return proposed === expected;
  }
  if (typeof proposed !== 'number' || !Number.isFinite(proposed)) {
    return false;
  }
  if (expected === 0) {
    return Math.abs(proposed) < 1e-9;
  }
  return Math.abs(proposed - expected) / Math.abs(expected) < 1e-6;
}

export function gradeAskAgentCase(
  testCase: AskAgentEvalCase,
  proposed: ProposedReform | null
): AskAgentCaseGrade {
  const reform = proposed?.reform ?? {};
  const expectedPaths = Object.keys(testCase.expected);
  const pathsFound = expectedPaths.filter((path) => path in reform).length;
  const valuesCorrect = expectedPaths.filter(
    (path) => path in reform && sameReformValue(testCase.expected[path], reform[path])
  ).length;
  const allCorrect = expectedPaths.length > 0 && valuesCorrect === expectedPaths.length;
  const proposedPaths = Object.keys(reform).length;
  return {
    expectedPaths: expectedPaths.length,
    proposedPaths,
    pathsFound,
    valuesCorrect,
    allCorrect,
    exact: allCorrect && proposedPaths === expectedPaths.length,
  };
}

/** USD per million tokens: input, output, cache read, 5-minute cache write. */
const PRICES: Record<string, [number, number, number, number]> = {
  'claude-opus-5-5': [4, 20, 0.2, 5],
  'claude-opus-5': [5, 25, 0.5, 6.25],
  'claude-sonnet-5-5': [2, 10, 0.2, 2.5],
  'claude-haiku-4-5': [1, 5, 0.1, 1.25],
};

/** Estimated list-price cost of a run; unknown models are priced as Opus 5. */
export function estimateCostUsd(model: string, usage: AskAgentUsage): number {
  const [input, output, cacheRead, cacheWrite] = PRICES[model] ?? PRICES['claude-opus-5'];
  return (
    (usage.inputTokens * input +
      usage.outputTokens * output +
      usage.cacheReadTokens * cacheRead +
      usage.cacheWriteTokens * cacheWrite) /
    1_000_000
  );
}

export interface AskAgentSuiteSummary {
  cases: number;
  errors: number;
  /** Share of cases with every expected value right. */
  allCorrectRate: number;
  exactRate: number;
  /** Mean share of expected paths the drafted reform contains. */
  pathRecall: number;
  /** Mean share of expected paths set to the expected value. */
  valueAccuracy: number;
  /** Share judged equivalent to the analyst's reform, when a judge ran. */
  judgedEquivalentRate: number | null;
  judgedPartialRate: number | null;
  meanModelCalls: number;
  meanCostUsd: number;
  totalCostUsd: number;
  medianLatencyMs: number;
}

const mean = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function median(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeAskAgentResults(results: AskAgentCaseResult[]): AskAgentSuiteSummary {
  const ratio = (numerator: number, denominator: number) =>
    denominator ? numerator / denominator : 0;
  const judged = results.filter((r) => r.judge);
  return {
    cases: results.length,
    errors: results.filter((result) => result.error).length,
    allCorrectRate: ratio(results.filter((r) => r.grade.allCorrect).length, results.length),
    exactRate: ratio(results.filter((r) => r.grade.exact).length, results.length),
    pathRecall: mean(results.map((r) => ratio(r.grade.pathsFound, r.grade.expectedPaths))),
    valueAccuracy: mean(results.map((r) => ratio(r.grade.valuesCorrect, r.grade.expectedPaths))),
    judgedEquivalentRate: judged.length
      ? ratio(judged.filter((r) => r.judge?.verdict === 'equivalent').length, judged.length)
      : null,
    judgedPartialRate: judged.length
      ? ratio(judged.filter((r) => r.judge?.verdict === 'partial').length, judged.length)
      : null,
    meanModelCalls: mean(results.map((r) => r.usage.modelCalls)),
    meanCostUsd: mean(results.map((r) => r.costUsd)),
    totalCostUsd: results.reduce((sum, r) => sum + r.costUsd, 0),
    medianLatencyMs: median(results.map((r) => r.latencyMs)),
  };
}

/**
 * Suites reported separately, never blended: contributed-parameter bills
 * need parameters search hides by default, and multi-provision bills are
 * a different task from one-parameter ones.
 */
export function groupAskAgentResults(
  results: AskAgentCaseResult[]
): Record<string, AskAgentCaseResult[]> {
  return {
    all: results,
    'one parameter': results.filter((r) => !r.contrib && r.expectedPaths === 1),
    '2 to 5 parameters': results.filter(
      (r) => !r.contrib && r.expectedPaths >= 2 && r.expectedPaths <= 5
    ),
    '6 or more parameters': results.filter((r) => !r.contrib && r.expectedPaths >= 6),
    'contributed parameters': results.filter((r) => r.contrib),
  };
}

/** The message a user drafting this bill would send. */
export function askAgentEvalPrompt(testCase: AskAgentEvalCase): string {
  const summary = testCase.description.trim();
  return `Draft this bill as a reform: ${testCase.title.trim()}.${summary ? ` ${summary}` : ''}`;
}

/** Evenly spaced cases, so a small sample spans the whole suite. */
export function sampleAskAgentCases<T>(cases: T[], limit: number | null): T[] {
  if (!limit || limit >= cases.length) {
    return cases;
  }
  const step = cases.length / limit;
  return Array.from({ length: limit }, (_, i) => cases[Math.floor(i * step)]);
}

export type JudgeVerdict = 'equivalent' | 'partial' | 'different' | 'none';

export interface ReformLine {
  path: string;
  label: string;
  current: unknown;
  value: unknown;
}

/**
 * Exact paths undercount equivalent drafts (a flat-rate parameter instead
 * of every bracket set to one rate, say), so a judge model compares the two
 * reforms' effect on the law. Its verdict is reported next to the exact
 * scores, never instead of them.
 */
export function buildJudgePrompt(
  testCase: AskAgentEvalCase,
  expected: ReformLine[],
  proposed: ReformLine[]
): string {
  const lines = (reform: ReformLine[]) =>
    reform.length
      ? reform
          .map(
            (line) =>
              `- ${line.path} (${line.label}): current law ${JSON.stringify(line.current)} -> ${JSON.stringify(line.value)}`
          )
          .join('\n')
      : '- (no changes)';
  return `You are checking whether two PolicyEngine reforms implement the same bill.

Bill: ${testCase.title}
${testCase.description}

Reference reform, built by an analyst:
${lines(expected)}

Drafted reform, to be judged:
${lines(proposed)}

Judge the effect on the law for the bill's main provisions, not the parameter names. Two reforms are equivalent if they would change taxes and benefits the same way (for example, one flat-rate parameter versus setting every bracket to that rate). Minor differences in provisions the bill does not mention do not matter.

Reply with only a JSON object: {"verdict": "equivalent" | "partial" | "different", "reason": "<one sentence>"}. Use "partial" when the draft gets some but not all of the bill's main provisions right.`;
}

export function parseJudgeVerdict(text: string): { verdict: JudgeVerdict; reason: string } {
  const match = text.match(/\{[\s\S]*\}/);
  try {
    const parsed = match ? JSON.parse(match[0]) : null;
    if (parsed && ['equivalent', 'partial', 'different'].includes(parsed.verdict)) {
      return { verdict: parsed.verdict, reason: String(parsed.reason ?? '') };
    }
  } catch {
    // Fall through to an unreadable verdict.
  }
  return { verdict: 'different', reason: 'Unreadable judge reply' };
}
