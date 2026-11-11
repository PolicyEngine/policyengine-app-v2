import { describe, expect, test } from 'vitest';
import { REPORT_OVERVIEW_TAB, reportTabUrl } from '@/hooks/useReportTabHistory';

const REPORT_PATH = '/us/report/3741';

describe('reportTabUrl', () => {
  test('given a section then the address names it', () => {
    expect(reportTabUrl(REPORT_PATH, '', 'validation')).toBe(`${REPORT_PATH}?tab=validation`);
  });

  test('given another section open then the address names the new one', () => {
    expect(reportTabUrl(REPORT_PATH, '?tab=economy', 'household')).toBe(
      `${REPORT_PATH}?tab=household`
    );
  });

  test('given the overview then the address is the report link with no section', () => {
    expect(reportTabUrl(REPORT_PATH, '?tab=validation', REPORT_OVERVIEW_TAB)).toBe(REPORT_PATH);
  });

  test('given other query parameters then they stay', () => {
    expect(reportTabUrl(REPORT_PATH, '?from=reforms', 'districts')).toBe(
      `${REPORT_PATH}?from=reforms&tab=districts`
    );
    expect(reportTabUrl(REPORT_PATH, '?from=reforms&tab=districts', REPORT_OVERVIEW_TAB)).toBe(
      `${REPORT_PATH}?from=reforms`
    );
  });
});
