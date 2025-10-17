import { describe, expect, it } from 'vitest';
import {
  formatParameterValue,
  getPlotlyAxisFormat,
} from '@/utils/chartValueUtils';
import {
  BOOLEAN_FALSE_VALUE,
  BOOLEAN_TRUE_VALUE,
  CURRENCY_GBP_VALUE,
  CURRENCY_USD_VALUE,
  EMPTY_VALUES,
  EXPECTED_FORMATS,
  getExpectedBooleanAxisFormat,
  getExpectedDateAxisFormat,
  getExpectedGBPAxisFormat,
  getExpectedNumericAxisFormat,
  getExpectedPercentageAxisFormat,
  getExpectedUSDAxisFormat,
  INVALID_DATE_VALUES,
  NEGATIVE_VALUE,
  NULL_VALUE,
  NUMERIC_VALUE,
  PERCENTAGE_VALUE,
  SAMPLE_BOOLEAN_VALUES,
  SAMPLE_CURRENCY_VALUES,
  SAMPLE_DATE_VALUES,
  SAMPLE_NUMERIC_VALUES,
  SAMPLE_PERCENTAGE_VALUES,
  UNDEFINED_VALUE,
  UNITS,
  ZERO_VALUE,
} from '@/tests/fixtures/utils/chartValueUtilsMocks';

describe('chartValueUtils', () => {
  describe('formatParameterValue', () => {
    describe('null and undefined handling', () => {
      it('should return N/A for null value', () => {
        const result = formatParameterValue(NULL_VALUE, UNITS.USD);
        expect(result).toBe(EXPECTED_FORMATS.NULL);
      });

      it('should return N/A for undefined value', () => {
        const result = formatParameterValue(UNDEFINED_VALUE, UNITS.USD);
        expect(result).toBe(EXPECTED_FORMATS.UNDEFINED);
      });
    });

    describe('currency formatting (USD)', () => {
      it('should format USD with symbol by default', () => {
        const result = formatParameterValue(CURRENCY_USD_VALUE, UNITS.USD);
        expect(result).toBe(EXPECTED_FORMATS.USD_WITH_SYMBOL);
      });

      it('should format currency-USD variant', () => {
        const result = formatParameterValue(CURRENCY_USD_VALUE, UNITS.USD);
        expect(result).toBe(EXPECTED_FORMATS.USD_WITH_SYMBOL);
      });

      it('should format currency_USD variant', () => {
        const result = formatParameterValue(
          CURRENCY_USD_VALUE,
          UNITS.USD_UNDERSCORE
        );
        expect(result).toBe(EXPECTED_FORMATS.USD_WITH_SYMBOL);
      });

      it('should format USD without symbol when option set', () => {
        const result = formatParameterValue(CURRENCY_USD_VALUE, UNITS.USD, {
          includeSymbol: false,
        });
        expect(result).toBe(EXPECTED_FORMATS.USD_WITHOUT_SYMBOL);
      });

      it('should respect decimalPlaces option', () => {
        const result = formatParameterValue(CURRENCY_USD_VALUE, UNITS.USD, {
          decimalPlaces: 0,
        });
        expect(result).toBe(EXPECTED_FORMATS.USD_ZERO_DECIMALS);
      });

      it('should format zero currency value', () => {
        const result = formatParameterValue(ZERO_VALUE, UNITS.USD);
        expect(result).toBe(EXPECTED_FORMATS.ZERO);
      });

      it('should format negative currency value', () => {
        const result = formatParameterValue(NEGATIVE_VALUE, UNITS.USD);
        expect(result).toBe(EXPECTED_FORMATS.NEGATIVE);
      });
    });

    describe('currency formatting (GBP)', () => {
      it('should format GBP with symbol by default', () => {
        const result = formatParameterValue(CURRENCY_GBP_VALUE, UNITS.GBP);
        expect(result).toBe(EXPECTED_FORMATS.GBP_WITH_SYMBOL);
      });

      it('should format currency-GBP variant', () => {
        const result = formatParameterValue(CURRENCY_GBP_VALUE, UNITS.GBP);
        expect(result).toBe(EXPECTED_FORMATS.GBP_WITH_SYMBOL);
      });

      it('should format currency_GBP variant', () => {
        const result = formatParameterValue(
          CURRENCY_GBP_VALUE,
          UNITS.GBP_UNDERSCORE
        );
        expect(result).toBe(EXPECTED_FORMATS.GBP_WITH_SYMBOL);
      });

      it('should format GBP without symbol when option set', () => {
        const result = formatParameterValue(CURRENCY_GBP_VALUE, UNITS.GBP, {
          includeSymbol: false,
        });
        expect(result).toBe(EXPECTED_FORMATS.GBP_WITHOUT_SYMBOL);
      });
    });

    describe('percentage formatting', () => {
      it('should format percentage with default decimal places', () => {
        const result = formatParameterValue(PERCENTAGE_VALUE, UNITS.PERCENTAGE);
        expect(result).toBe(EXPECTED_FORMATS.PERCENTAGE_DEFAULT);
      });

      it('should multiply by 100 and add % symbol', () => {
        const result = formatParameterValue(0.5, UNITS.PERCENTAGE);
        expect(result).toBe('50.00%');
      });

      it('should respect decimalPlaces option', () => {
        const result = formatParameterValue(PERCENTAGE_VALUE, UNITS.PERCENTAGE, {
          decimalPlaces: 0,
        });
        expect(result).toBe(EXPECTED_FORMATS.PERCENTAGE_ZERO_DECIMALS);
      });

      it('should format with one decimal place', () => {
        const result = formatParameterValue(PERCENTAGE_VALUE, UNITS.PERCENTAGE, {
          decimalPlaces: 1,
        });
        expect(result).toBe(EXPECTED_FORMATS.PERCENTAGE_ONE_DECIMAL);
      });
    });

    describe('boolean formatting', () => {
      it('should format true as "True" for bool unit', () => {
        const result = formatParameterValue(BOOLEAN_TRUE_VALUE, UNITS.BOOLEAN);
        expect(result).toBe(EXPECTED_FORMATS.BOOLEAN_TRUE);
      });

      it('should format false as "False" for bool unit', () => {
        const result = formatParameterValue(BOOLEAN_FALSE_VALUE, UNITS.BOOLEAN);
        expect(result).toBe(EXPECTED_FORMATS.BOOLEAN_FALSE);
      });

      it('should format true as "True" for abolition unit', () => {
        const result = formatParameterValue(
          BOOLEAN_TRUE_VALUE,
          UNITS.ABOLITION
        );
        expect(result).toBe(EXPECTED_FORMATS.BOOLEAN_TRUE);
      });

      it('should format false as "False" for abolition unit', () => {
        const result = formatParameterValue(
          BOOLEAN_FALSE_VALUE,
          UNITS.ABOLITION
        );
        expect(result).toBe(EXPECTED_FORMATS.BOOLEAN_FALSE);
      });
    });

    describe('numeric formatting', () => {
      it('should format numeric value with default settings', () => {
        const result = formatParameterValue(NUMERIC_VALUE, UNITS.NUMERIC);
        expect(result).toBe(EXPECTED_FORMATS.NUMERIC_DEFAULT);
      });

      it('should format with zero decimal places', () => {
        const result = formatParameterValue(NUMERIC_VALUE, UNITS.NUMERIC, {
          decimalPlaces: 0,
        });
        expect(result).toBe(EXPECTED_FORMATS.NUMERIC_ZERO_DECIMALS);
      });

      it('should format with four decimal places', () => {
        const result = formatParameterValue(NUMERIC_VALUE, UNITS.NUMERIC, {
          decimalPlaces: 4,
        });
        expect(result).toBe(EXPECTED_FORMATS.NUMERIC_FOUR_DECIMALS);
      });

      it('should format null unit as numeric', () => {
        const result = formatParameterValue(NUMERIC_VALUE, UNITS.NULL);
        expect(result).toBe(EXPECTED_FORMATS.NUMERIC_DEFAULT);
      });

      it('should format undefined unit as numeric', () => {
        const result = formatParameterValue(NUMERIC_VALUE, UNITS.UNDEFINED);
        expect(result).toBe(EXPECTED_FORMATS.NUMERIC_DEFAULT);
      });
    });
  });

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
        const result = getPlotlyAxisFormat(
          UNITS.PERCENTAGE,
          SAMPLE_PERCENTAGE_VALUES
        );
        const expected = getExpectedPercentageAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include correct tick format and range', () => {
        const result = getPlotlyAxisFormat(
          UNITS.PERCENTAGE,
          SAMPLE_PERCENTAGE_VALUES
        );
        expect(result.tickformat).toBe('.1%');
        expect(result.range).toEqual([0.1, 1.0]);
      });
    });

    describe('currency axis (USD)', () => {
      it('should return USD axis format with currency-USD', () => {
        const result = getPlotlyAxisFormat(
          UNITS.USD,
          SAMPLE_CURRENCY_VALUES
        );
        const expected = getExpectedUSDAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should return USD axis format with currency_USD', () => {
        const result = getPlotlyAxisFormat(
          UNITS.USD_UNDERSCORE,
          SAMPLE_CURRENCY_VALUES
        );
        const expected = getExpectedUSDAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should return USD axis format with USD short', () => {
        const result = getPlotlyAxisFormat(
          UNITS.USD_SHORT,
          SAMPLE_CURRENCY_VALUES
        );
        const expected = getExpectedUSDAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include $ prefix and comma formatting', () => {
        const result = getPlotlyAxisFormat(
          UNITS.USD,
          SAMPLE_CURRENCY_VALUES
        );
        expect(result.tickprefix).toBe('$');
        expect(result.tickformat).toBe(',.0f');
      });
    });

    describe('currency axis (GBP)', () => {
      it('should return GBP axis format with currency-GBP', () => {
        const result = getPlotlyAxisFormat(
          UNITS.GBP,
          SAMPLE_CURRENCY_VALUES
        );
        const expected = getExpectedGBPAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should return GBP axis format with currency_GBP', () => {
        const result = getPlotlyAxisFormat(
          UNITS.GBP_UNDERSCORE,
          SAMPLE_CURRENCY_VALUES
        );
        const expected = getExpectedGBPAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include £ prefix and comma formatting', () => {
        const result = getPlotlyAxisFormat(
          UNITS.GBP,
          SAMPLE_CURRENCY_VALUES
        );
        expect(result.tickprefix).toBe('£');
        expect(result.tickformat).toBe(',.0f');
      });
    });

    describe('boolean axis', () => {
      it('should return boolean axis format for bool unit', () => {
        const result = getPlotlyAxisFormat(
          UNITS.BOOLEAN,
          SAMPLE_BOOLEAN_VALUES
        );
        const expected = getExpectedBooleanAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should return boolean axis format for abolition unit', () => {
        const result = getPlotlyAxisFormat(
          UNITS.ABOLITION,
          SAMPLE_BOOLEAN_VALUES
        );
        const expected = getExpectedBooleanAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include custom tick values and text', () => {
        const result = getPlotlyAxisFormat(
          UNITS.BOOLEAN,
          SAMPLE_BOOLEAN_VALUES
        );
        expect(result.tickvals).toEqual([0, 1]);
        expect(result.ticktext).toEqual(['False', 'True']);
        expect(result.range).toEqual([-0.1, 1.1]);
      });
    });

    describe('numeric axis', () => {
      it('should return numeric axis format', () => {
        const result = getPlotlyAxisFormat(
          UNITS.NUMERIC,
          SAMPLE_NUMERIC_VALUES
        );
        const expected = getExpectedNumericAxisFormat();
        expect(result).toEqual(expected);
      });

      it('should include correct tick format and range', () => {
        const result = getPlotlyAxisFormat(
          UNITS.NUMERIC,
          SAMPLE_NUMERIC_VALUES
        );
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
