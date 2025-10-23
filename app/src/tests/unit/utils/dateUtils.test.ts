import { describe, expect, it } from 'vitest';
import {
  EXPECTED_FORMATS,
  TEST_COUNTRIES,
  TEST_DATES,
} from '@/tests/fixtures/utils/dateUtilsMocks';
import { formatDate } from '@/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    describe('short-month-day-year format', () => {
      it('given ISO date then formats as short month', () => {
        // When
        const result = formatDate(
          TEST_DATES.ISO_2024_01_01,
          'short-month-day-year',
          TEST_COUNTRIES.US
        );

        // Then
        expect(result).toBe(EXPECTED_FORMATS.SHORT_MONTH_US);
      });

      it('given mid-year date then formats correctly', () => {
        // When
        const result = formatDate(
          TEST_DATES.ISO_2024_06_15,
          'short-month-day-year',
          TEST_COUNTRIES.US
        );

        // Then
        expect(result).toContain('Jun');
        expect(result).toContain('15');
        expect(result).toContain('2024');
      });
    });

    describe('full-date format', () => {
      it('given ISO date then formats as full date', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_2024_01_01, 'full-date', TEST_COUNTRIES.US);

        // Then
        expect(result).toBe(EXPECTED_FORMATS.FULL_DATE_US);
      });

      it('given December date then formats correctly', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_2024_12_31, 'full-date', TEST_COUNTRIES.US);

        // Then
        expect(result).toContain('December');
        expect(result).toContain('31');
        expect(result).toContain('2024');
      });
    });

    describe('numeric-date format', () => {
      it('given ISO date then formats as numeric', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_2024_01_01, 'numeric-date', TEST_COUNTRIES.US);

        // Then
        expect(result).toBe(EXPECTED_FORMATS.NUMERIC_DATE_US);
      });
    });

    describe('iso-date format', () => {
      it('given ISO date then formats with 2-digit month and day', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_2024_01_01, 'iso-date', TEST_COUNTRIES.US);

        // Then
        expect(result).toContain('01');
        expect(result).toContain('2024');
      });
    });

    describe('year-only format', () => {
      it('given ISO date then returns only year', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_2024_01_01, 'year-only', TEST_COUNTRIES.US);

        // Then
        expect(result).toBe(EXPECTED_FORMATS.YEAR_ONLY);
      });

      it('given date with time then returns only year', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_WITH_TIME, 'year-only', TEST_COUNTRIES.US);

        // Then
        expect(result).toBe(EXPECTED_FORMATS.YEAR_ONLY);
      });
    });

    describe('country-specific formatting', () => {
      it('given US country then uses US locale', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_2024_01_01, 'numeric-date', TEST_COUNTRIES.US);

        // Then
        // US format: M/D/YYYY
        expect(result).toBe('1/1/2024');
      });

      it('given UK country then uses UK locale', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_2024_01_01, 'numeric-date', TEST_COUNTRIES.UK);

        // Then
        // UK format: DD/MM/YYYY
        expect(result).toBe('01/01/2024');
      });
    });

    describe('stripTime parameter', () => {
      it('given stripTime true then removes time component', () => {
        // When
        const result = formatDate(
          TEST_DATES.ISO_WITH_TIME,
          'short-month-day-year',
          TEST_COUNTRIES.US,
          true
        );

        // Then
        expect(result).toContain('Mar');
        expect(result).toContain('15');
        expect(result).toContain('2024');
      });

      it('given stripTime false then preserves date', () => {
        // When
        const result = formatDate(
          TEST_DATES.ISO_2024_01_01,
          'short-month-day-year',
          TEST_COUNTRIES.US,
          false
        );

        // Then
        expect(result).toBe(EXPECTED_FORMATS.SHORT_MONTH_US);
      });
    });

    describe('default parameters', () => {
      it('given no country then defaults to US', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_2024_01_01, 'numeric-date');

        // Then
        expect(result).toBe('1/1/2024'); // US format
      });

      it('given no stripTime then defaults to false', () => {
        // When
        const result = formatDate(
          TEST_DATES.ISO_2024_01_01,
          'short-month-day-year',
          TEST_COUNTRIES.US
        );

        // Then
        expect(result).toBe(EXPECTED_FORMATS.SHORT_MONTH_US);
      });
    });
  });
});
