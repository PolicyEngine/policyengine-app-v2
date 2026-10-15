import { describe, expect, test } from 'vitest';
import { tooltipText } from '@/libs/flagship/tooltipText';

describe('tooltipText', () => {
  test('given a message broken by hand for Plotly then it reads as one paragraph', () => {
    expect(
      tooltipText(
        'This reform would increase the share of total net\nincome held by people in the top 1% of households\nby less than 0.1%'
      )
    ).toBe(
      'This reform would increase the share of total net income held by people in the top 1% of households by less than 0.1%'
    );
  });
});
