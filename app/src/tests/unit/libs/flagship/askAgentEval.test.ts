import { describe, expect, test } from 'vitest';
import {
  askAgentEvalPrompt,
  buildJudgePrompt,
  caseValidityIssues,
  estimateCostUsd,
  extractProposedReform,
  gradeAskAgentCase,
  groupAskAgentResults,
  parseJudgeVerdict,
  sameReformValue,
  sampleAskAgentCases,
  summarizeAskAgentResults,
  type AskAgentCaseResult,
  type AskAgentEvalCase,
} from '@/libs/flagship/askAgentEval';
import type { AskAgentToolCall } from '@/libs/flagship/usAskLoop';

const RATE = 'gov.states.ut.tax.income.rate';
const CREDIT = 'gov.states.ut.tax.income.credits.ctc.amount';

const CASE: AskAgentEvalCase = {
  id: 'ut-sb60',
  title: 'Utah SB60',
  description: 'Cuts the rate to 4.45% and raises the child credit to $1,000.',
  state: 'UT',
  expected: { [RATE]: 0.0445, [CREDIT]: 1000 },
  contrib: false,
  multiPeriod: false,
};

const validateCall = (reform: Record<string, unknown>, valid: boolean): AskAgentToolCall => ({
  id: `v-${Object.keys(reform).length}-${valid}`,
  name: 'validate_reform',
  input: { reform },
  output: JSON.stringify({ valid }),
  isError: !valid,
});

function resultFor(overrides: Partial<AskAgentCaseResult>): AskAgentCaseResult {
  return {
    id: 'x',
    contrib: false,
    expectedPaths: 1,
    grade: {
      expectedPaths: 1,
      proposedPaths: 1,
      pathsFound: 1,
      valuesCorrect: 1,
      allCorrect: true,
      exact: true,
    },
    validated: true,
    usage: {
      modelCalls: 3,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    costUsd: 0.1,
    latencyMs: 1000,
    stopReason: 'answered',
    ...overrides,
  };
}

describe('extractProposedReform', () => {
  test('given several validations then the last valid reform is the draft', () => {
    const proposed = extractProposedReform([
      validateCall({ [RATE]: 0.05 }, true),
      validateCall({ [RATE]: 0.0445, [CREDIT]: 1000 }, true),
      validateCall({ bogus: 1 }, false),
    ]);

    expect(proposed).toEqual({ reform: { [RATE]: 0.0445, [CREDIT]: 1000 }, validated: true });
  });

  test('given no valid reform then the last attempt is graded as unvalidated', () => {
    expect(extractProposedReform([validateCall({ bogus: 1 }, false)])).toEqual({
      reform: { bogus: 1 },
      validated: false,
    });
  });

  test('given no validation call then there is no draft', () => {
    expect(extractProposedReform([])).toBeNull();
  });
});

describe('gradeAskAgentCase', () => {
  test('given every expected value then the draft is exact', () => {
    const grade = gradeAskAgentCase(CASE, {
      reform: { [RATE]: 0.0445, [CREDIT]: 1000 },
      validated: true,
    });

    expect(grade).toEqual({
      expectedPaths: 2,
      proposedPaths: 2,
      pathsFound: 2,
      valuesCorrect: 2,
      allCorrect: true,
      exact: true,
    });
  });

  test('given an extra change then the draft is correct but not exact', () => {
    const grade = gradeAskAgentCase(CASE, {
      reform: { [RATE]: 0.0445, [CREDIT]: 1000, 'gov.other': 1 },
      validated: true,
    });

    expect(grade.allCorrect).toBe(true);
    expect(grade.exact).toBe(false);
  });

  test('given a percentage instead of a fraction then the path is found but the value is wrong', () => {
    const grade = gradeAskAgentCase(CASE, {
      reform: { [RATE]: 4.45, [CREDIT]: 1000 },
      validated: true,
    });

    expect(grade.pathsFound).toBe(2);
    expect(grade.valuesCorrect).toBe(1);
    expect(grade.allCorrect).toBe(false);
  });

  test('given no draft then nothing is found', () => {
    expect(gradeAskAgentCase(CASE, null).pathsFound).toBe(0);
  });
});

describe('sameReformValue', () => {
  test('given numbers then tiny float differences still match', () => {
    expect(sameReformValue(0.0445, 0.044500000001)).toBe(true);
    expect(sameReformValue(0, 0)).toBe(true);
    expect(sameReformValue(1000, 1001)).toBe(false);
  });

  test('given booleans then only the same boolean matches', () => {
    expect(sameReformValue(true, true)).toBe(true);
    expect(sameReformValue(true, 1)).toBe(false);
  });
});

describe('estimateCostUsd', () => {
  test('given usage then list prices apply per token type', () => {
    const usage = {
      modelCalls: 1,
      inputTokens: 1_000_000,
      outputTokens: 100_000,
      cacheReadTokens: 1_000_000,
      cacheWriteTokens: 0,
    };
    // Opus 5.5: $4 input, $20 output, $0.20 cache read per million.
    expect(estimateCostUsd('claude-opus-5-5', usage)).toBeCloseTo(4 + 2 + 0.2);
  });
});

describe('summarizeAskAgentResults', () => {
  test('given results then rates and costs are averaged across cases', () => {
    const summary = summarizeAskAgentResults([
      resultFor({}),
      resultFor({
        grade: {
          expectedPaths: 2,
          proposedPaths: 1,
          pathsFound: 1,
          valuesCorrect: 0,
          allCorrect: false,
          exact: false,
        },
        costUsd: 0.3,
        latencyMs: 3000,
        judge: { verdict: 'partial', reason: '' },
      }),
    ]);

    expect(summary.allCorrectRate).toBe(0.5);
    expect(summary.pathRecall).toBe(0.75);
    expect(summary.valueAccuracy).toBe(0.5);
    expect(summary.totalCostUsd).toBeCloseTo(0.4);
    expect(summary.medianLatencyMs).toBe(2000);
    expect(summary.judgedPartialRate).toBe(1);
  });

  test('given no judge ran then judged rates are empty', () => {
    expect(summarizeAskAgentResults([resultFor({})]).judgedEquivalentRate).toBeNull();
  });
});

describe('groupAskAgentResults', () => {
  test('given results then contributed and multi-parameter bills get their own suites', () => {
    const groups = groupAskAgentResults([
      resultFor({ id: 'one', expectedPaths: 1 }),
      resultFor({ id: 'few', expectedPaths: 3 }),
      resultFor({ id: 'many', expectedPaths: 9 }),
      resultFor({ id: 'contrib', expectedPaths: 1, contrib: true }),
    ]);

    expect(groups['one parameter'].map((r) => r.id)).toEqual(['one']);
    expect(groups['2 to 5 parameters'].map((r) => r.id)).toEqual(['few']);
    expect(groups['6 or more parameters'].map((r) => r.id)).toEqual(['many']);
    expect(groups['contributed parameters'].map((r) => r.id)).toEqual(['contrib']);
    expect(groups.all).toHaveLength(4);
  });
});

describe('askAgentEvalPrompt', () => {
  test('given a bill then the prompt reads like a user pasting it', () => {
    expect(askAgentEvalPrompt(CASE)).toBe(
      'Draft this bill as a reform: Utah SB60. Cuts the rate to 4.45% and raises the child credit to $1,000.'
    );
  });
});

describe('sampleAskAgentCases', () => {
  test('given a limit then evenly spaced cases are chosen', () => {
    expect(sampleAskAgentCases([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3)).toEqual([0, 3, 6]);
    expect(sampleAskAgentCases([0, 1], null)).toEqual([0, 1]);
  });
});

describe('judge', () => {
  test('given two reforms then the prompt lists both with current law', () => {
    const prompt = buildJudgePrompt(
      CASE,
      [{ path: RATE, label: 'Utah rate', current: 0.045, value: 0.0445 }],
      []
    );

    expect(prompt).toContain('Utah SB60');
    expect(prompt).toContain(`- ${RATE} (Utah rate): current law 0.045 -> 0.0445`);
    expect(prompt).toContain('- (no changes)');
  });

  test('given a JSON reply then the verdict is read, and anything else counts as different', () => {
    expect(parseJudgeVerdict('Sure: {"verdict": "equivalent", "reason": "Same rate"}')).toEqual({
      verdict: 'equivalent',
      reason: 'Same rate',
    });
    expect(parseJudgeVerdict('no json here').verdict).toBe('different');
    expect(parseJudgeVerdict('{"verdict": "maybe"}').verdict).toBe('different');
  });
});

describe('caseValidityIssues', () => {
  test('given a reference that equals current law then the case cannot be passed', () => {
    expect(caseValidityIssues(CASE, (path) => CASE.expected[path])).toEqual([
      'reference-matches-current-law',
    ]);
  });

  test('given a reference that restates most of a schedule then it is flagged', () => {
    const schedule: AskAgentEvalCase = {
      ...CASE,
      expected: { a: 1, b: 2, c: 3, d: 4, e: 5 },
    };
    const law: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 9 };

    expect(caseValidityIssues(schedule, (path) => law[path])).toEqual([
      'reference-mostly-current-law',
    ]);
  });

  test('given a real change and no review note then the case is valid', () => {
    expect(caseValidityIssues(CASE, () => 0.05)).toEqual([]);
  });

  test('given a reviewed stale reference then the reason is kept', () => {
    expect(caseValidityIssues(CASE, () => 0.05, 'Uses a retired schedule')).toEqual([
      'reference-stale',
    ]);
  });
});
