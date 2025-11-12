import { describe, expect, it } from 'vitest';
import {
  EMPTY_VALUES,
  getExpectedBooleanAxisFormat,
  getExpectedDateAxisFormat,
  getExpectedGBPAxisFormat,
  getExpectedNumericAxisFormat,
  getExpectedPercentageAxisFormat,
  getExpectedUSDAxisFormat,
  INVALID_DATE_VALUES,
  SAMPLE_BOOLEAN_VALUES,
  SAMPLE_CURRENCY_VALUES,
  SAMPLE_DATE_VALUES,
  SAMPLE_NUMERIC_VALUES,
  SAMPLE_PERCENTAGE_VALUES,
  UNITS,
} from '@/tests/fixtures/utils/chartValueUtilsMocks';
import { getPlotlyAxisFormat } from '@/utils/chartValueUtils';

describe('chartValueUtils', () => {

  describe('getPlotlyAxisFormat', () => {
    describe('date axis', () => {
      it('should return date axis format with correct range', () => {
        const result = getPlotlyAxisFormat('date', SAMPLE_DATE_VALUES);
        const expected = getExpectedDateAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should handle empty date values', () => {
        const result = getPlotlyAxisFormat('date', EMPTY_VALUES);
        expect(result.type).toBe('date');
        expect(result.range).toBeUndefined();
      });

      it('should filter out invalid dates', () => {
        const result = getPlotlyAxisFormat('date', INVALID_DATE_VALUES);
        expect(result.type).toBe('date');
        expect(result.range).toBeUndefined();
      });

      it('should handle single date value', () => {
        const result = getPlotlyAxisFormat('date', ['2023-01-01']);
        expect(result.type).toBe('date');
        expect(result.range).toEqual(['2023-01-01', '2023-01-01']);
      });
    });

    describe('percentage axis', () => {
      it('should return percentage axis format', () => {
        const result = getPlotlyAxisFormat(UNITS.PERCENTAGE, SAMPLE_PERCENTAGE_VALUES);
        const expected = getExpectedPercentageAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include correct tick format and range', () => {
        const result = getPlotlyAxisFormat(UNITS.PERCENTAGE, SAMPLE_PERCENTAGE_VALUES);
        expect(result.tickformat).toBe('.1%');
        expect(result.range).toEqual([0.1, 1.0]);
      });
    });

    describe('currency axis (USD)', () => {
      it('should return USD axis format with currency-USD', () => {
        const result = getPlotlyAxisFormat(UNITS.USD, SAMPLE_CURRENCY_VALUES);
        const expected = getExpectedUSDAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should return USD axis format with currency_USD', () => {
        const result = getPlotlyAxisFormat(UNITS.USD_UNDERSCORE, SAMPLE_CURRENCY_VALUES);
        const expected = getExpectedUSDAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should return USD axis format with USD short', () => {
        const result = getPlotlyAxisFormat(UNITS.USD_SHORT, SAMPLE_CURRENCY_VALUES);
        const expected = getExpectedUSDAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include $ prefix and comma formatting', () => {
        const result = getPlotlyAxisFormat(UNITS.USD, SAMPLE_CURRENCY_VALUES);
        expect(result.tickprefix).toBe('$');
        expect(result.tickformat).toBe(',.0f');
      });
    });

    describe('currency axis (GBP)', () => {
      it('should return GBP axis format with currency-GBP', () => {
        const result = getPlotlyAxisFormat(UNITS.GBP, SAMPLE_CURRENCY_VALUES);
        const expected = getExpectedGBPAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should return GBP axis format with currency_GBP', () => {
        const result = getPlotlyAxisFormat(UNITS.GBP_UNDERSCORE, SAMPLE_CURRENCY_VALUES);
        const expected = getExpectedGBPAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include £ prefix and comma formatting', () => {
        const result = getPlotlyAxisFormat(UNITS.GBP, SAMPLE_CURRENCY_VALUES);
        expect(result.tickprefix).toBe('£');
        expect(result.tickformat).toBe(',.0f');
      });
    });

    describe('boolean axis', () => {
      it('should return boolean axis format for bool unit', () => {
        const result = getPlotlyAxisFormat(UNITS.BOOLEAN, SAMPLE_BOOLEAN_VALUES);
        const expected = getExpectedBooleanAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should return boolean axis format for abolition unit', () => {
        const result = getPlotlyAxisFormat(UNITS.ABOLITION, SAMPLE_BOOLEAN_VALUES);
        const expected = getExpectedBooleanAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include custom tick values and text', () => {
        const result = getPlotlyAxisFormat(UNITS.BOOLEAN, SAMPLE_BOOLEAN_VALUES);
        expect(result.tickvals).toEqual([0, 1]);
        expect(result.ticktext).toEqual(['False', 'True']);
        expect(result.range).toEqual([-0.1, 1.1]);
      });
    });

    describe('numeric axis', () => {
      it('should return numeric axis format', () => {
        const result = getPlotlyAxisFormat(UNITS.NUMERIC, SAMPLE_NUMERIC_VALUES);
        const expected = getExpectedNumericAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include correct tick format and range', () => {
        const result = getPlotlyAxisFormat(UNITS.NUMERIC, SAMPLE_NUMERIC_VALUES);
        expect(result.tickformat).toBe(',.2f');
        expect(result.range).toEqual([100, 500]);
      });

      it('should handle empty values array', () => {
        const result = getPlotlyAxisFormat(UNITS.NUMERIC, EMPTY_VALUES);
        expect(result).toEqual({});
      });

      it('should handle single value', () => {
        const result = getPlotlyAxisFormat(UNITS.NUMERIC, [42]);
        expect(result.range).toEqual([42, 42]);
      });
    });
  });
});
