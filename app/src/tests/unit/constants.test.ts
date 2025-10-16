import { describe, expect, test } from 'vitest';
import { FOREVER, BASE_URL, CURRENT_YEAR, MOCK_USER_ID } from '@/constants';
import {
  DEFAULT_CHART_START_DATE,
  DEFAULT_CHART_END_DATE,
  CHART_COLORS,
  CHART_DIMENSIONS,
  CHART_MARGINS,
} from '@/constants/chart';
import {
  EXPECTED_CHART_START_DATE,
  EXPECTED_CURRENT_YEAR,
  EXPECTED_CHART_END_DATE,
  EXPECTED_COLORS,
  EXPECTED_DIMENSIONS,
  EXPECTED_MARGINS_DESKTOP,
  EXPECTED_MARGINS_MOBILE,
  isValidHexColor,
  isValidDateFormat,
  isValidDate,
} from '@/tests/fixtures/constantsMocks';

describe('constants', () => {
  describe('given base application constants', () => {
    test('given FOREVER then is valid date in far future', () => {
      // Given/When
      const forever = FOREVER;

      // Then
      expect(isValidDateFormat(forever)).toBe(true);
      expect(isValidDate(forever)).toBe(true);
      expect(new Date(forever).getFullYear()).toBeGreaterThanOrEqual(2100);
    });

    test('given BASE_URL then is valid HTTPS URL', () => {
      // Given/When
      const baseUrl = BASE_URL;

      // Then
      expect(baseUrl).toMatch(/^https:\/\//);
      expect(() => new URL(baseUrl)).not.toThrow();
    });

    test('given CURRENT_YEAR then is valid year string', () => {
      // Given/When
      const currentYear = CURRENT_YEAR;

      // Then
      expect(currentYear).toBe(EXPECTED_CURRENT_YEAR);
      expect(/^\d{4}$/.test(currentYear)).toBe(true);
    });

    test('given MOCK_USER_ID then is non-empty string', () => {
      // Given/When
      const mockUserId = MOCK_USER_ID;

      // Then
      expect(mockUserId).toBe('anonymous');
      expect(mockUserId.length).toBeGreaterThan(0);
    });
  });

  describe('given chart date constants', () => {
    test('given DEFAULT_CHART_START_DATE then is valid date format', () => {
      // Given/When
      const startDate = DEFAULT_CHART_START_DATE;

      // Then
      expect(startDate).toBe(EXPECTED_CHART_START_DATE);
      expect(isValidDateFormat(startDate)).toBe(true);
      expect(isValidDate(startDate)).toBe(true);
    });

    test('given DEFAULT_CHART_END_DATE then is 10 years from current year', () => {
      // Given/When
      const endDate = DEFAULT_CHART_END_DATE;

      // Then
      expect(endDate).toBe(EXPECTED_CHART_END_DATE);
      expect(isValidDateFormat(endDate)).toBe(true);
      expect(isValidDate(endDate)).toBe(true);
    });

    test('given chart date range then start is before end', () => {
      // Given
      const startDate = new Date(DEFAULT_CHART_START_DATE);
      const endDate = new Date(DEFAULT_CHART_END_DATE);

      // When/Then
      expect(startDate.getTime()).toBeLessThan(endDate.getTime());
    });

    test('given DEFAULT_CHART_END_DATE then is before FOREVER', () => {
      // Given
      const chartEnd = new Date(DEFAULT_CHART_END_DATE);
      const forever = new Date(FOREVER);

      // When/Then
      expect(chartEnd.getTime()).toBeLessThan(forever.getTime());
    });
  });

  describe('given CHART_COLORS', () => {
    test('given REFORM color then is valid hex color', () => {
      // Given/When
      const color = CHART_COLORS.REFORM;

      // Then
      expect(color).toBe(EXPECTED_COLORS.REFORM);
      expect(isValidHexColor(color)).toBe(true);
    });

    test('given BASELINE_WITH_REFORM color then is valid hex color', () => {
      // Given/When
      const color = CHART_COLORS.BASELINE_WITH_REFORM;

      // Then
      expect(color).toBe(EXPECTED_COLORS.BASELINE_WITH_REFORM);
      expect(isValidHexColor(color)).toBe(true);
    });

    test('given BASELINE_NO_REFORM color then is valid hex color', () => {
      // Given/When
      const color = CHART_COLORS.BASELINE_NO_REFORM;

      // Then
      expect(color).toBe(EXPECTED_COLORS.BASELINE_NO_REFORM);
      expect(isValidHexColor(color)).toBe(true);
    });

    test('given PLOT_BACKGROUND color then is valid hex color', () => {
      // Given/When
      const color = CHART_COLORS.PLOT_BACKGROUND;

      // Then
      expect(color).toBe(EXPECTED_COLORS.PLOT_BACKGROUND);
      expect(isValidHexColor(color)).toBe(true);
    });

    test('given GRID color then is valid hex color', () => {
      // Given/When
      const color = CHART_COLORS.GRID;

      // Then
      expect(color).toBe(EXPECTED_COLORS.GRID);
      expect(isValidHexColor(color)).toBe(true);
    });

    test('given AXIS_LINE color then is valid hex color', () => {
      // Given/When
      const color = CHART_COLORS.AXIS_LINE;

      // Then
      expect(color).toBe(EXPECTED_COLORS.AXIS_LINE);
      expect(isValidHexColor(color)).toBe(true);
    });

    test('given all colors then they are unique', () => {
      // Given
      const colors = Object.values(CHART_COLORS);

      // When
      const uniqueColors = new Set(colors);

      // Then
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe('given CHART_DIMENSIONS', () => {
    test('given DESKTOP_HEIGHT then is positive number', () => {
      // Given/When
      const height = CHART_DIMENSIONS.DESKTOP_HEIGHT;

      // Then
      expect(height).toBe(EXPECTED_DIMENSIONS.DESKTOP_HEIGHT);
      expect(height).toBeGreaterThan(0);
      expect(Number.isInteger(height)).toBe(true);
    });

    test('given MOBILE_HEIGHT_RATIO then is between 0 and 1', () => {
      // Given/When
      const ratio = CHART_DIMENSIONS.MOBILE_HEIGHT_RATIO;

      // Then
      expect(ratio).toBe(EXPECTED_DIMENSIONS.MOBILE_HEIGHT_RATIO);
      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThanOrEqual(1);
    });

    test('given MIN_HEIGHT then is positive number', () => {
      // Given/When
      const minHeight = CHART_DIMENSIONS.MIN_HEIGHT;

      // Then
      expect(minHeight).toBe(EXPECTED_DIMENSIONS.MIN_HEIGHT);
      expect(minHeight).toBeGreaterThan(0);
      expect(Number.isInteger(minHeight)).toBe(true);
    });

    test('given MIN_HEIGHT then is less than DESKTOP_HEIGHT', () => {
      // Given
      const minHeight = CHART_DIMENSIONS.MIN_HEIGHT;
      const desktopHeight = CHART_DIMENSIONS.DESKTOP_HEIGHT;

      // When/Then
      expect(minHeight).toBeLessThanOrEqual(desktopHeight);
    });
  });

  describe('given CHART_MARGINS', () => {
    describe('given DESKTOP margins', () => {
      test('given top margin then is positive number', () => {
        // Given/When
        const margin = CHART_MARGINS.DESKTOP.top;

        // Then
        expect(margin).toBe(EXPECTED_MARGINS_DESKTOP.top);
        expect(margin).toBeGreaterThan(0);
      });

      test('given right margin then is positive number', () => {
        // Given/When
        const margin = CHART_MARGINS.DESKTOP.right;

        // Then
        expect(margin).toBe(EXPECTED_MARGINS_DESKTOP.right);
        expect(margin).toBeGreaterThan(0);
      });

      test('given left margin then is positive number', () => {
        // Given/When
        const margin = CHART_MARGINS.DESKTOP.left;

        // Then
        expect(margin).toBe(EXPECTED_MARGINS_DESKTOP.left);
        expect(margin).toBeGreaterThan(0);
      });

      test('given bottom margin then is positive number', () => {
        // Given/When
        const margin = CHART_MARGINS.DESKTOP.bottom;

        // Then
        expect(margin).toBe(EXPECTED_MARGINS_DESKTOP.bottom);
        expect(margin).toBeGreaterThan(0);
      });

      test('given all desktop margins then match expected values', () => {
        // Given/When
        const margins = CHART_MARGINS.DESKTOP;

        // Then
        expect(margins).toEqual(EXPECTED_MARGINS_DESKTOP);
      });
    });

    describe('given MOBILE margins', () => {
      test('given top margin then is positive number', () => {
        // Given/When
        const margin = CHART_MARGINS.MOBILE.top;

        // Then
        expect(margin).toBe(EXPECTED_MARGINS_MOBILE.top);
        expect(margin).toBeGreaterThan(0);
      });

      test('given right margin then is positive number', () => {
        // Given/When
        const margin = CHART_MARGINS.MOBILE.right;

        // Then
        expect(margin).toBe(EXPECTED_MARGINS_MOBILE.right);
        expect(margin).toBeGreaterThan(0);
      });

      test('given left margin then is positive number', () => {
        // Given/When
        const margin = CHART_MARGINS.MOBILE.left;

        // Then
        expect(margin).toBe(EXPECTED_MARGINS_MOBILE.left);
        expect(margin).toBeGreaterThan(0);
      });

      test('given bottom margin then is positive number', () => {
        // Given/When
        const margin = CHART_MARGINS.MOBILE.bottom;

        // Then
        expect(margin).toBe(EXPECTED_MARGINS_MOBILE.bottom);
        expect(margin).toBeGreaterThan(0);
      });

      test('given all mobile margins then match expected values', () => {
        // Given/When
        const margins = CHART_MARGINS.MOBILE;

        // Then
        expect(margins).toEqual(EXPECTED_MARGINS_MOBILE);
      });
    });

    test('given mobile top margin then is larger than desktop top margin', () => {
      // Given
      const mobileTop = CHART_MARGINS.MOBILE.top;
      const desktopTop = CHART_MARGINS.DESKTOP.top;

      // When/Then
      expect(mobileTop).toBeGreaterThan(desktopTop);
    });
  });
});
