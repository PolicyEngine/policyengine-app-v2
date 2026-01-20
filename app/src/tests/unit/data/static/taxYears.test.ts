import { describe, expect, it } from 'vitest';
import { getDateRange, getTaxYears } from '@/data/static/taxYears';
import {
  DEFAULT_DATE_RANGE,
  EXPECTED_TAX_YEAR_RANGE,
  TEST_COUNTRIES,
} from '@/tests/fixtures/data/static/staticDataMocks';

describe('taxYears', () => {
  describe('getTaxYears', () => {
    it('given US country code then returns array of tax year options', () => {
      // When
      const taxYears = getTaxYears(TEST_COUNTRIES.US);

      // Then
      expect(Array.isArray(taxYears)).toBe(true);
      expect(taxYears.length).toBeGreaterThan(0);
    });

    it('given US country code then each option has value and label', () => {
      // When
      const taxYears = getTaxYears(TEST_COUNTRIES.US);

      // Then
      taxYears.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });

    it('given US country code then years are sorted ascending', () => {
      // When
      const taxYears = getTaxYears(TEST_COUNTRIES.US);
      const years = taxYears.map((opt) => parseInt(opt.value, 10));

      // Then
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBeGreaterThanOrEqual(years[i - 1]);
      }
    });

    it('given US country code then includes expected year range', () => {
      // When
      const taxYears = getTaxYears(TEST_COUNTRIES.US);
      const years = taxYears.map((opt) => parseInt(opt.value, 10));

      // Then
      expect(Math.min(...years)).toBe(EXPECTED_TAX_YEAR_RANGE.US.min);
      expect(Math.max(...years)).toBe(EXPECTED_TAX_YEAR_RANGE.US.max);
    });

    it('given UK country code then returns array of tax year options', () => {
      // When
      const taxYears = getTaxYears(TEST_COUNTRIES.UK);

      // Then
      expect(Array.isArray(taxYears)).toBe(true);
      expect(taxYears.length).toBeGreaterThan(0);
    });

    it('given UK country code then includes expected year range', () => {
      // When
      const taxYears = getTaxYears(TEST_COUNTRIES.UK);
      const years = taxYears.map((opt) => parseInt(opt.value, 10));

      // Then
      expect(Math.min(...years)).toBe(EXPECTED_TAX_YEAR_RANGE.UK.min);
      expect(Math.max(...years)).toBe(EXPECTED_TAX_YEAR_RANGE.UK.max);
    });

    it('given unknown country code then returns empty array', () => {
      // When
      const taxYears = getTaxYears(TEST_COUNTRIES.UNKNOWN);

      // Then
      expect(taxYears).toEqual([]);
    });
  });

  describe('getDateRange', () => {
    it('given US country code then returns date range object', () => {
      // When
      const dateRange = getDateRange(TEST_COUNTRIES.US);

      // Then
      expect(dateRange).toHaveProperty('minDate');
      expect(dateRange).toHaveProperty('maxDate');
    });

    it('given US country code then dates are in YYYY-MM-DD format', () => {
      // When
      const dateRange = getDateRange(TEST_COUNTRIES.US);

      // Then
      expect(dateRange.minDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dateRange.maxDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('given US country code then minDate starts on Jan 1', () => {
      // When
      const dateRange = getDateRange(TEST_COUNTRIES.US);

      // Then
      expect(dateRange.minDate).toMatch(/-01-01$/);
    });

    it('given US country code then maxDate ends on Dec 31', () => {
      // When
      const dateRange = getDateRange(TEST_COUNTRIES.US);

      // Then
      expect(dateRange.maxDate).toMatch(/-12-31$/);
    });

    it('given UK country code then returns valid date range', () => {
      // When
      const dateRange = getDateRange(TEST_COUNTRIES.UK);

      // Then
      expect(dateRange.minDate).toMatch(/^\d{4}-01-01$/);
      expect(dateRange.maxDate).toMatch(/^\d{4}-12-31$/);
    });

    it('given unknown country code then returns default fallback range', () => {
      // When
      const dateRange = getDateRange(TEST_COUNTRIES.UNKNOWN);

      // Then
      expect(dateRange).toEqual(DEFAULT_DATE_RANGE);
    });
  });
});
