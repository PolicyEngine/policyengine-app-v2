import { describe, expect, test } from 'vitest';
import {
  formatParameterValue,
  getPlotlyAxisFormat,
  extendDataToFuture,
  buildXAxisValues,
  buildYAxisValues,
  calculateChartHeight,
} from '@/libs/chartUtils';
import {
  PARAM_USD,
  PARAM_GBP,
  PARAM_PERCENTAGE,
  PARAM_BOOLEAN,
  PARAM_NUMERIC,
  TEST_VALUES,
  EXPECTED_FORMATTED,
  TEST_DATES,
  TEST_NUMERIC_VALUES,
  EXPECTED_AXIS_FORMAT_DATE,
  EXPECTED_AXIS_FORMAT_USD,
  EXPECTED_AXIS_FORMAT_GBP,
  EXPECTED_AXIS_FORMAT_PERCENTAGE,
  EXPECTED_AXIS_FORMAT_BOOLEAN,
  EXPECTED_AXIS_FORMAT_NUMERIC_SMALL,
  EXPECTED_AXIS_FORMAT_NUMERIC_MEDIUM,
  EXPECTED_AXIS_FORMAT_NUMERIC_LARGE,
  expectAxisFormatToMatch,
} from '@/tests/fixtures/libs/chartUtilsMocks';

describe('formatParameterValue', () => {
  describe('given null or undefined values', () => {
    test('given null then returns N/A', () => {
      // Given
      const value = TEST_VALUES.NULL;

      // When
      const result = formatParameterValue(PARAM_USD, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.NA);
    });

    test('given undefined then returns N/A', () => {
      // Given
      const value = TEST_VALUES.UNDEFINED;

      // When
      const result = formatParameterValue(PARAM_USD, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.NA);
    });
  });

  describe('given boolean parameter', () => {
    test('given true value then returns True', () => {
      // Given
      const value = TEST_VALUES.BOOLEAN_TRUE;

      // When
      const result = formatParameterValue(PARAM_BOOLEAN, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.BOOLEAN_TRUE);
    });

    test('given false value then returns False', () => {
      // Given
      const value = TEST_VALUES.BOOLEAN_FALSE;

      // When
      const result = formatParameterValue(PARAM_BOOLEAN, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.BOOLEAN_FALSE);
    });

    test('given numeric 1 then returns True', () => {
      // Given
      const value = 1;

      // When
      const result = formatParameterValue(PARAM_BOOLEAN, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.BOOLEAN_TRUE);
    });

    test('given numeric 0 then returns False', () => {
      // Given
      const value = 0;

      // When
      const result = formatParameterValue(PARAM_BOOLEAN, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.BOOLEAN_FALSE);
    });
  });

  describe('given USD currency parameter', () => {
    test('given positive integer then formats with dollar sign and commas', () => {
      // Given
      const value = TEST_VALUES.POSITIVE_INTEGER;

      // When
      const result = formatParameterValue(PARAM_USD, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.USD_1000);
    });

    test('given positive decimal then formats with dollar sign and two decimal places', () => {
      // Given
      const value = TEST_VALUES.POSITIVE_DECIMAL;

      // When
      const result = formatParameterValue(PARAM_USD, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.USD_1234_56);
    });

    test('given negative value then formats with negative sign', () => {
      // Given
      const value = TEST_VALUES.NEGATIVE_INTEGER;

      // When
      const result = formatParameterValue(PARAM_USD, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.USD_NEGATIVE_500);
    });

    test('given zero then formats as $0.00', () => {
      // Given
      const value = TEST_VALUES.ZERO;

      // When
      const result = formatParameterValue(PARAM_USD, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.USD_ZERO);
    });
  });

  describe('given GBP currency parameter', () => {
    test('given positive integer then formats with pound sign and commas', () => {
      // Given
      const value = 500;

      // When
      const result = formatParameterValue(PARAM_GBP, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.GBP_500);
    });

    test('given positive decimal then formats with pound sign and two decimal places', () => {
      // Given
      const value = TEST_VALUES.POSITIVE_DECIMAL;

      // When
      const result = formatParameterValue(PARAM_GBP, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.GBP_1234_56);
    });
  });

  describe('given percentage parameter', () => {
    test('given 0.2 then formats as 20.00%', () => {
      // Given
      const value = 0.2;

      // When
      const result = formatParameterValue(PARAM_PERCENTAGE, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.PERCENTAGE_20);
    });

    test('given 0.123 then formats as 12.30%', () => {
      // Given
      const value = TEST_VALUES.SMALL_DECIMAL;

      // When
      const result = formatParameterValue(PARAM_PERCENTAGE, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.PERCENTAGE_0_123);
    });

    test('given 1 then formats as 100.00%', () => {
      // Given
      const value = 1;

      // When
      const result = formatParameterValue(PARAM_PERCENTAGE, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.PERCENTAGE_1);
    });
  });

  describe('given numeric parameter', () => {
    test('given integer then formats with commas and two decimal places', () => {
      // Given
      const value = TEST_VALUES.POSITIVE_INTEGER;

      // When
      const result = formatParameterValue(PARAM_NUMERIC, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.NUMERIC_1000);
    });

    test('given small decimal then formats with three decimal places', () => {
      // Given
      const value = TEST_VALUES.SMALL_DECIMAL;

      // When
      const result = formatParameterValue(PARAM_NUMERIC, value, 3);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.NUMERIC_0_123);
    });
  });

  describe('given invalid values', () => {
    test('given string that cannot be parsed then returns N/A', () => {
      // Given
      const value = TEST_VALUES.STRING_INVALID;

      // When
      const result = formatParameterValue(PARAM_NUMERIC, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.NA);
    });

    test('given string number then parses and formats correctly', () => {
      // Given
      const value = TEST_VALUES.STRING_NUMBER;

      // When
      const result = formatParameterValue(PARAM_USD, value);

      // Then
      expect(result).toBe(EXPECTED_FORMATTED.USD_123_45);
    });
  });

  describe('given custom precision', () => {
    test('given precision 0 then formats without decimal places', () => {
      // Given
      const value = TEST_VALUES.POSITIVE_DECIMAL;

      // When
      const result = formatParameterValue(PARAM_USD, value, 0);

      // Then
      expect(result).toBe('$1,235');
    });

    test('given precision 4 then formats with four decimal places', () => {
      // Given
      const value = 1234.5678;

      // When
      const result = formatParameterValue(PARAM_USD, value, 4);

      // Then
      expect(result).toBe('$1,234.5678');
    });
  });
});

describe('getPlotlyAxisFormat', () => {
  describe('given date unit', () => {
    test('given date array then returns date axis format', () => {
      // Given
      const unit = 'date';
      const values = TEST_DATES;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_DATE);
    });

    test('given Date unit with capital D then returns date axis format', () => {
      // Given
      const unit = 'Date';
      const values = TEST_DATES;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_DATE);
    });
  });

  describe('given USD currency unit', () => {
    test('given currency-USD then returns USD axis format', () => {
      // Given
      const unit = 'currency-USD';
      const values = TEST_NUMERIC_VALUES.CURRENCY;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_USD);
    });

    test('given currency_USD then returns USD axis format', () => {
      // Given
      const unit = 'currency_USD';
      const values = TEST_NUMERIC_VALUES.CURRENCY;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_USD);
    });

    test('given USD then returns USD axis format', () => {
      // Given
      const unit = 'USD';
      const values = TEST_NUMERIC_VALUES.CURRENCY;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_USD);
    });
  });

  describe('given GBP currency unit', () => {
    test('given currency-GBP then returns GBP axis format', () => {
      // Given
      const unit = 'currency-GBP';
      const values = TEST_NUMERIC_VALUES.CURRENCY;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_GBP);
    });

    test('given currency_GBP then returns GBP axis format', () => {
      // Given
      const unit = 'currency_GBP';
      const values = TEST_NUMERIC_VALUES.CURRENCY;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_GBP);
    });

    test('given GBP then returns GBP axis format', () => {
      // Given
      const unit = 'GBP';
      const values = TEST_NUMERIC_VALUES.CURRENCY;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_GBP);
    });
  });

  describe('given percentage unit', () => {
    test('given /1 then returns percentage axis format', () => {
      // Given
      const unit = '/1';
      const values = TEST_NUMERIC_VALUES.PERCENTAGE;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_PERCENTAGE);
    });

    test('given percent then returns percentage axis format', () => {
      // Given
      const unit = 'percent';
      const values = TEST_NUMERIC_VALUES.PERCENTAGE;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_PERCENTAGE);
    });

    test('given percentage then returns percentage axis format', () => {
      // Given
      const unit = 'percentage';
      const values = TEST_NUMERIC_VALUES.PERCENTAGE;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_PERCENTAGE);
    });
  });

  describe('given boolean unit', () => {
    test('given bool then returns boolean axis format', () => {
      // Given
      const unit = 'bool';
      const values = TEST_NUMERIC_VALUES.BOOLEAN;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_BOOLEAN);
    });

    test('given boolean then returns boolean axis format', () => {
      // Given
      const unit = 'boolean';
      const values = TEST_NUMERIC_VALUES.BOOLEAN;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_BOOLEAN);
    });
  });

  describe('given numeric values with varying ranges', () => {
    test('given small range < 1 then uses 3 decimal places', () => {
      // Given
      const unit = 'number';
      const values = TEST_NUMERIC_VALUES.SMALL_RANGE;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_NUMERIC_SMALL);
    });

    test('given medium range 1-100 then uses 1 decimal place', () => {
      // Given
      const unit = 'number';
      const values = TEST_NUMERIC_VALUES.MEDIUM_RANGE;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_NUMERIC_MEDIUM);
    });

    test('given large range > 100 then uses 0 decimal places', () => {
      // Given
      const unit = 'number';
      const values = TEST_NUMERIC_VALUES.LARGE_RANGE;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_NUMERIC_LARGE);
    });
  });

  describe('given edge cases', () => {
    test('given empty values array then returns basic grid config', () => {
      // Given
      const unit = 'number';
      const values: any[] = [];

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expect(result).toHaveProperty('showgrid', true);
      expect(result).toHaveProperty('gridcolor', '#e9ecef');
    });

    test('given null unit then uses default numeric format', () => {
      // Given
      const unit = null as any;
      const values = TEST_NUMERIC_VALUES.LARGE_RANGE;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expect(result).toHaveProperty('showgrid', true);
      expect(result).toHaveProperty('gridcolor', '#e9ecef');
    });

    test('given undefined unit then uses default numeric format', () => {
      // Given
      const unit = undefined as any;
      const values = TEST_NUMERIC_VALUES.LARGE_RANGE;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expect(result).toHaveProperty('showgrid', true);
      expect(result).toHaveProperty('gridcolor', '#e9ecef');
    });

    test('given values with non-numeric items then filters them out', () => {
      // Given
      const unit = 'number';
      const values = [1, 'invalid', 2, null, 3, undefined, 4];

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expect(result).toHaveProperty('tickformat');
      expect(result.tickformat).toBe(',.2f'); // Small range 1-4
    });

    test('given all non-numeric values then returns basic config', () => {
      // Given
      const unit = 'number';
      const values = ['invalid', null, undefined, 'not a number'];

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expect(result).toHaveProperty('showgrid', true);
      expect(result).toHaveProperty('gridcolor', '#e9ecef');
      expect(result).not.toHaveProperty('tickformat');
    });
  });

  describe('given case insensitivity', () => {
    test('given CURRENCY-USD in uppercase then returns USD format', () => {
      // Given
      const unit = 'CURRENCY-USD';
      const values = TEST_NUMERIC_VALUES.CURRENCY;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_USD);
    });

    test('given Bool in mixed case then returns boolean format', () => {
      // Given
      const unit = 'Bool';
      const values = TEST_NUMERIC_VALUES.BOOLEAN;

      // When
      const result = getPlotlyAxisFormat(unit, values);

      // Then
      expectAxisFormatToMatch(result, EXPECTED_AXIS_FORMAT_BOOLEAN);
    });
  });
});

describe('extendDataToFuture', () => {
  test('given dates and values then extends to 2099-12-31', () => {
    // Given
    const dates = ['2020-01-01', '2021-01-01', '2022-01-01'];
    const values = [100, 200, 300];

    // When
    extendDataToFuture(dates, values);

    // Then
    expect(dates).toHaveLength(4);
    expect(dates[3]).toBe('2099-12-31');
    expect(values).toHaveLength(4);
    expect(values[3]).toBe(300);
  });

  test('given empty arrays then adds 2099-12-31 with undefined', () => {
    // Given
    const dates: string[] = [];
    const values: any[] = [];

    // When
    extendDataToFuture(dates, values);

    // Then
    expect(dates).toHaveLength(1);
    expect(dates[0]).toBe('2099-12-31');
    expect(values).toHaveLength(1);
    expect(values[0]).toBeUndefined();
  });

  test('given single value then duplicates last value', () => {
    // Given
    const dates = ['2020-01-01'];
    const values = [500];

    // When
    extendDataToFuture(dates, values);

    // Then
    expect(dates).toHaveLength(2);
    expect(values[1]).toBe(500);
  });
});

describe('buildXAxisValues', () => {
  test('given base dates only then filters and adds boundaries', () => {
    // Given
    const baseDates = ['2020-01-01', '2021-01-01', '2022-01-01'];

    // When
    const result = buildXAxisValues(baseDates);

    // Then
    expect(result).toContain('2020-01-01');
    expect(result).toContain('2021-01-01');
    expect(result).toContain('2022-01-01');
    expect(result).toContain('1900-01-01'); // DEFAULT_CHART_START_DATE
    expect(result).toContain('2035-12-31'); // DEFAULT_CHART_END_DATE
  });

  test('given base and reform dates then combines them', () => {
    // Given
    const baseDates = ['2020-01-01', '2021-01-01'];
    const reformDates = ['2023-01-01', '2024-01-01'];

    // When
    const result = buildXAxisValues(baseDates, reformDates);

    // Then
    expect(result).toContain('2020-01-01');
    expect(result).toContain('2021-01-01');
    expect(result).toContain('2023-01-01');
    expect(result).toContain('2024-01-01');
  });

  test('given placeholder date 0000-01-01 then filters it out', () => {
    // Given
    const baseDates = ['0000-01-01', '2020-01-01', '2021-01-01'];

    // When
    const result = buildXAxisValues(baseDates);

    // Then
    expect(result).not.toContain('0000-01-01');
    expect(result).toContain('2020-01-01');
  });

  test('given 2099-12-31 then filters it out', () => {
    // Given
    const baseDates = ['2020-01-01', '2099-12-31'];

    // When
    const result = buildXAxisValues(baseDates);

    // Then
    expect(result).not.toContain('2099-12-31');
    expect(result).toContain('2020-01-01');
  });
});

describe('buildYAxisValues', () => {
  test('given base values only then returns base values', () => {
    // Given
    const baseValues = [100, 200, 300];

    // When
    const result = buildYAxisValues(baseValues);

    // Then
    expect(result).toEqual([100, 200, 300]);
  });

  test('given base and reform values then combines them', () => {
    // Given
    const baseValues = [100, 200, 300];
    const reformValues = [150, 250];

    // When
    const result = buildYAxisValues(baseValues, reformValues);

    // Then
    expect(result).toEqual([100, 200, 300, 150, 250]);
  });

  test('given empty reform values then returns base values', () => {
    // Given
    const baseValues = [100, 200];
    const reformValues: any[] = [];

    // When
    const result = buildYAxisValues(baseValues, reformValues);

    // Then
    expect(result).toEqual([100, 200]);
  });
});

describe('calculateChartHeight', () => {
  test('given mobile then uses viewport ratio with minimum constraint', () => {
    // Given
    const isMobile = true;
    const viewportHeight = 800;
    const mobileRatio = 0.5;
    const desktopHeight = 400;
    const minHeight = 300;

    // When
    const result = calculateChartHeight(
      isMobile,
      viewportHeight,
      mobileRatio,
      desktopHeight,
      minHeight
    );

    // Then
    expect(result).toBe(400); // 800 * 0.5
  });

  test('given mobile with small viewport then uses minimum height', () => {
    // Given
    const isMobile = true;
    const viewportHeight = 500;
    const mobileRatio = 0.5;
    const desktopHeight = 400;
    const minHeight = 300;

    // When
    const result = calculateChartHeight(
      isMobile,
      viewportHeight,
      mobileRatio,
      desktopHeight,
      minHeight
    );

    // Then
    expect(result).toBe(300); // max(500 * 0.5, 300) = 300
  });

  test('given desktop then uses fixed desktop height', () => {
    // Given
    const isMobile = false;
    const viewportHeight = 1200;
    const mobileRatio = 0.5;
    const desktopHeight = 400;
    const minHeight = 300;

    // When
    const result = calculateChartHeight(
      isMobile,
      viewportHeight,
      mobileRatio,
      desktopHeight,
      minHeight
    );

    // Then
    expect(result).toBe(400);
  });

  test('given desktop then ignores viewport height', () => {
    // Given
    const isMobile = false;
    const viewportHeight = 200; // Very small
    const mobileRatio = 0.5;
    const desktopHeight = 400;
    const minHeight = 300;

    // When
    const result = calculateChartHeight(
      isMobile,
      viewportHeight,
      mobileRatio,
      desktopHeight,
      minHeight
    );

    // Then
    expect(result).toBe(400); // Still uses desktop height
  });
});
