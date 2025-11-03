import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EXPECTED_FORMATS,
  TEST_COUNTRIES,
  TEST_DATES,
} from '@/tests/fixtures/utils/dateUtilsMocks';
import { formatDate, formatReportTimestamp } from '@/utils/dateUtils';

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
      it('given US country then uses US format', () => {
        // When
        const result = formatDate(TEST_DATES.ISO_2024_01_01, 'numeric-date', 'us');

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

  describe('formatReportTimestamp', () => {
    beforeEach(() => {
      // Reset Date mocks before each test
      vi.useRealTimers();
    });

    describe('given undefined or null timestamp', () => {
      it('then returns fallback message', () => {
        // When
        const result = formatReportTimestamp(undefined);

        // Then
        expect(result).toBe('Ran recently');
      });
    });

    describe('given timestamp from today', () => {
      it('then returns "Ran today at HH:MM:SS"', () => {
        // Given - Mock current time
        const now = new Date('2024-01-15T14:30:45');
        vi.setSystemTime(now);

        // Create timestamp from earlier today
        const todayTimestamp = new Date('2024-01-15T10:23:41').toISOString();

        // When
        const result = formatReportTimestamp(todayTimestamp);

        // Then
        expect(result).toMatch(/^Ran today at \d{2}:\d{2}:\d{2}$/);
        expect(result).toContain('10:23:41');
      });
    });

    describe('given timestamp from this year but not today', () => {
      it('then returns "Ran on Month Day at HH:MM:SS" without year', () => {
        // Given - Mock current time in December
        const now = new Date('2024-12-31T23:59:59');
        vi.setSystemTime(now);

        // Create timestamp from earlier this year
        const thisYearTimestamp = new Date('2024-06-15T14:23:41').toISOString();

        // When
        const result = formatReportTimestamp(thisYearTimestamp);

        // Then
        expect(result).toMatch(/^Ran on [A-Z][a-z]+ \d{1,2} at \d{2}:\d{2}:\d{2}$/);
        expect(result).toContain('Jun 15');
        expect(result).toContain('14:23:41');
        expect(result).not.toContain('2024'); // Year should not be shown
      });
    });

    describe('given timestamp from previous year', () => {
      it('then returns "Ran on Month Day, Year at HH:MM:SS"', () => {
        // Given - Mock current time in 2025
        const now = new Date('2025-01-15T12:00:00');
        vi.setSystemTime(now);

        // Create timestamp from 2024
        const lastYearTimestamp = new Date('2024-06-15T14:23:41').toISOString();

        // When
        const result = formatReportTimestamp(lastYearTimestamp);

        // Then
        expect(result).toMatch(/^Ran on [A-Z][a-z]+ \d{1,2}, \d{4} at \d{2}:\d{2}:\d{2}$/);
        expect(result).toContain('Jun 15, 2024');
        expect(result).toContain('14:23:41');
      });
    });

    describe('given timestamp with different time zones', () => {
      it('then formats in user local time', () => {
        // Given - Timestamp in UTC
        const utcTimestamp = '2024-01-15T10:00:00.000Z';

        // When
        const result = formatReportTimestamp(utcTimestamp);

        // Then - Should contain a time (exact time depends on system timezone)
        expect(result).toMatch(/at \d{2}:\d{2}:\d{2}$/);
      });
    });
  });
});
