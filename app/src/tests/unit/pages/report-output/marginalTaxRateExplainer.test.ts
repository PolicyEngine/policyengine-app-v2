import { describe, expect, test } from 'vitest';
import { marginalTaxRateExplainer } from '@/pages/report-output/marginal-tax-rates/MarginalTaxRatesSubPage';

describe('marginalTaxRateExplainer', () => {
  test('given no opt-in then it says dollar, as v2 always has', () => {
    expect(marginalTaxRateExplainer('us')).toContain('next dollar earned');
    expect(marginalTaxRateExplainer('uk')).toContain('next dollar earned');
  });

  test('given the opt-in then a UK household reads pound and a US one dollar', () => {
    expect(marginalTaxRateExplainer('uk', true)).toContain('next pound earned');
    expect(marginalTaxRateExplainer('us', true)).toContain('next dollar earned');
  });
});
