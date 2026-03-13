import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EXPECTED_FORMATS,
  EXPECTED_LOCAL_DATE_STRINGS,
  TEST_COUNTRIES,
  TEST_DATE_OBJECTS,
  TEST_DATES,
} from '@/tests/fixtures/utils/dateUtilsMocks';
import {
  formatDate,
  formatReportTimestamp,
  fromLocalDateString,
  toLocalDateString,
} from '@/utils/dateUtils';

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

    describe('given valid timestamp', () => {
      it('then returns "Ran {date} at {time}" format', () => {
        // Given
        const timestamp = new Date('2024-01-15T10:23:00').toISOString();

        // When
        const result = formatReportTimestamp(timestamp);

        // Then
        // Format: "Ran Jan 15, 2024 at 10:23 AM" (US format)
        expect(result).toMatch(/^Ran [A-Z][a-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2}/);
        expect(result).toContain('Jan 15, 2024');
      });

      it('given US country then uses US locale format', () => {
        // Given
        const timestamp = new Date('2024-06-15T14:30:00').toISOString();

        // When
        const result = formatReportTimestamp(timestamp, 'us');

        // Then - US format: "Ran Jun 15, 2024 at 2:30 PM"
        expect(result).toMatch(/^Ran [A-Z][a-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2}/);
        expect(result).toContain('Jun 15, 2024');
      });

      it('given UK country then uses UK locale format', () => {
        // Given
        const timestamp = new Date('2024-06-15T14:30:00').toISOString();

        // When
        const result = formatReportTimestamp(timestamp, 'uk');

        // Then - UK format: "Ran 15 Jun 2024 at 14:30"
        expect(result).toMatch(/^Ran \d{1,2} [A-Z][a-z]+ \d{4} at \d{1,2}:\d{2}$/);
        expect(result).toContain('15 Jun 2024');
      });
    });

    describe('given timestamp with different time zones', () => {
      it('then formats in user local time', () => {
        // Given - Timestamp in UTC
        const utcTimestamp = '2024-01-15T10:00:00.000Z';

        // When
        const result = formatReportTimestamp(utcTimestamp);

        // Then - Should contain a time (exact time depends on system timezone)
        // Format is "Ran {date} at {time}" where time can be "H:MM AM/PM" or "HH:MM"
        expect(result).toMatch(/at \d{1,2}:\d{2}/);
      });
    });
  });

  describe('toLocalDateString', () => {
    it('given Date at midnight local time then preserves the date', () => {
      // Given
      const date = TEST_DATE_OBJECTS.JAN_1_2025_MIDNIGHT_LOCAL;

      // When
      const result = toLocalDateString(date);

      // Then — must not shift to previous day regardless of timezone
      expect(result).toBe(EXPECTED_LOCAL_DATE_STRINGS.JAN_1_2025);
    });

    it('given year-end Date at midnight local time then preserves the date', () => {
      // Given
      const date = TEST_DATE_OBJECTS.DEC_31_2024_MIDNIGHT_LOCAL;

      // When
      const result = toLocalDateString(date);

      // Then
      expect(result).toBe(EXPECTED_LOCAL_DATE_STRINGS.DEC_31_2024);
    });

    it('given mid-year Date at midnight local time then preserves the date', () => {
      // Given
      const date = TEST_DATE_OBJECTS.JUL_4_2025_MIDNIGHT_LOCAL;

      // When
      const result = toLocalDateString(date);

      // Then
      expect(result).toBe(EXPECTED_LOCAL_DATE_STRINGS.JUL_4_2025);
    });

    it('given null then returns empty string', () => {
      // When
      const result = toLocalDateString(null);

      // Then
      expect(result).toBe('');
    });

    it('given date string then returns it unchanged', () => {
      // When
      const result = toLocalDateString(EXPECTED_LOCAL_DATE_STRINGS.JAN_1_2025);

      // Then
      expect(result).toBe(EXPECTED_LOCAL_DATE_STRINGS.JAN_1_2025);
    });
  });

  describe('fromLocalDateString', () => {
    it('given valid date string then returns Date in local timezone', () => {
      // Given
      const dateString = EXPECTED_LOCAL_DATE_STRINGS.JAN_1_2025;

      // When
      const result = fromLocalDateString(dateString);

      // Then — the Date should represent Jan 1 in local time
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(0);
      expect(result!.getDate()).toBe(1);
    });

    it('given empty string then returns undefined', () => {
      // When
      const result = fromLocalDateString('');

      // Then
      expect(result).toBeUndefined();
    });

    it('given round-trip through fromLocalDateString and toLocalDateString then preserves the date', () => {
      // Given
      const original = EXPECTED_LOCAL_DATE_STRINGS.DEC_31_2024;

      // When
      const dateObj = fromLocalDateString(original);
      const result = toLocalDateString(dateObj!);

      // Then
      expect(result).toBe(original);
    });
  });
});
