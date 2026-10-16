import { describe, expect, test } from 'vitest';
import {
  NO_RELATIVE_CHANGE_LABEL,
  rateChangeMessage,
  rateChangeTitle,
  relativeBar,
  relativeChange,
} from '@/components/flagship/report/charts/relativeChange';

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

describe('relativeChange', () => {
  test('given a baseline rate then the change is relative to it', () => {
    expect(relativeChange(0.024, 0.025)).toBeCloseTo(-0.04);
  });

  test('given a zero baseline then there is no ratio', () => {
    expect(relativeChange(0, 0)).toBeNull();
    expect(relativeChange(0.01, 0)).toBeNull();
  });
});

describe('relativeBar', () => {
  test('given a change then the label is signed', () => {
    expect(relativeBar(0.021, percent)).toEqual({ value: 0.021, label: '+2.1%' });
    expect(relativeBar(-0.04, percent)).toEqual({ value: -0.04, label: '-4.0%' });
  });

  test('given no ratio then the bar is zero and reads n/a', () => {
    expect(relativeBar(null, percent)).toEqual({ value: 0, label: NO_RELATIVE_CHANGE_LABEL });
  });
});

describe('rateChangeMessage', () => {
  test('given a baseline rate then the change reads as relative', () => {
    expect(rateChangeMessage('the rate', 0.025, 0.024, 'us', percent).replace(/\n/g, ' ')).toBe(
      'This reform would decrease the rate by 4.0% from 2.5% to 2.4%'
    );
  });

  test('given no one before or after then it has no effect', () => {
    expect(rateChangeMessage('the rate', 0, 0, 'us', percent)).toBe(
      'This reform would have no effect on the rate'
    );
  });

  test('given a rise from zero then it reads in percentage points', () => {
    expect(rateChangeMessage('the rate', 0, 0.01, 'us', percent).replace(/\n/g, ' ')).toBe(
      'This reform would increase the rate by 1.0pp, from 0.0% to 1.0%'
    );
  });
});

describe('rateChangeTitle', () => {
  test('given a baseline rate then the title gives the relative change and the points', () => {
    expect(rateChangeTitle('the poverty rate', 0.14, 0.133, 'us', ' in Maryland')).toBe(
      'This reform would decrease the poverty rate in Maryland by 5% (0.7pp)'
    );
  });

  test('given a rise from zero then the title gives the points alone', () => {
    expect(rateChangeTitle('the poverty rate', 0, 0.01, 'us', '')).toBe(
      'This reform would increase the poverty rate by 1pp'
    );
  });

  test('given no change then it has no effect', () => {
    expect(rateChangeTitle('the poverty rate', 0, 0, 'us', '')).toBe(
      'This reform would have no effect on the poverty rate'
    );
  });
});
