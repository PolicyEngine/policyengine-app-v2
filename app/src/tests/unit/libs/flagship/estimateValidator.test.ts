import { describe, expect, test } from 'vitest';
import { buildValidationPrompt, parseEstimateValidation } from '@/libs/flagship/estimateValidator';

describe('buildValidationPrompt', () => {
  test('given a reform with an estimate then the prompt names provisions and the figure', () => {
    const prompt = buildValidationPrompt({
      countryId: 'us',
      label: 'CTC to $2,500',
      provisions: [{ path: 'gov.irs.credits.ctc.amount.base[0].amount', value: 2500 }],
      peEstimate: -30000000000,
      year: '2026',
    });

    expect(prompt).toContain('gov.irs.credits.ctc.amount.base[0].amount = 2500');
    expect(prompt).toContain('-30,000,000,000');
    expect(prompt).toContain('year 2026');
  });

  test('given no estimate then the prompt says the computation is unfinished', () => {
    const prompt = buildValidationPrompt({
      countryId: 'us',
      label: 'Draft',
      provisions: [{ path: 'gov.x', value: 1 }],
    });

    expect(prompt).toContain('has not finished computing');
  });
});

describe('parseEstimateValidation', () => {
  test('given malformed findings then invalid rows drop and comparability defaults honestly', () => {
    const result = parseEstimateValidation({
      findings: [
        { source: 'JCT', proposal: 'CTC score', comparability: 'invented-tier', estimate: '5' },
        { source: 42, proposal: 'missing source' },
      ],
      assessment: 7,
      caveats: ['real caveat', 12],
    });

    expect(result.findings).toEqual([
      { source: 'JCT', proposal: 'CTC score', comparability: 'context' },
    ]);
    expect(result.assessment).toBeUndefined();
    expect(result.caveats).toEqual(['real caveat']);
  });

  test('given no findings array then an empty result returns instead of throwing', () => {
    expect(parseEstimateValidation(null).findings).toEqual([]);
  });
});
