import { countryIds } from '@/libs/countries';

type CountryId = (typeof countryIds)[number];

export type ReportAnalysisMode = 'single-year' | 'budget-window';

export interface ParsedReportTiming {
  analysisMode: ReportAnalysisMode;
  startYear: string;
  endYear: string;
  windowSize: number;
}

const BUDGET_WINDOW_PATTERN = /^(\d{4})-(\d{4})$/;

export function getDefaultBudgetWindowYears(countryId: CountryId): number {
  return countryId === 'uk' ? 5 : 10;
}

export function formatBudgetWindowYear(startYear: string, windowSize: number): string {
  const start = Number.parseInt(startYear, 10);
  const normalizedWindowSize = Math.max(2, windowSize);
  return `${startYear}-${start + normalizedWindowSize - 1}`;
}

export function isBudgetWindowReportYear(reportYear: string): boolean {
  return BUDGET_WINDOW_PATTERN.test(reportYear);
}

export function parseReportTiming(
  reportYear: string,
  _countryId: CountryId = 'us'
): ParsedReportTiming {
  const match = reportYear.match(BUDGET_WINDOW_PATTERN);

  if (!match) {
    return {
      analysisMode: 'single-year',
      startYear: reportYear,
      endYear: reportYear,
      windowSize: 1,
    };
  }

  const startYear = match[1];
  const endYear = match[2];
  const start = Number.parseInt(startYear, 10);
  const end = Number.parseInt(endYear, 10);

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return {
      analysisMode: 'single-year',
      startYear: reportYear,
      endYear: reportYear,
      windowSize: 1,
    };
  }

  return {
    analysisMode: 'budget-window',
    startYear,
    endYear,
    windowSize: end - start + 1,
  };
}

export function serializeReportTiming({
  analysisMode,
  startYear,
  budgetWindowYears,
}: {
  analysisMode: ReportAnalysisMode;
  startYear: string;
  budgetWindowYears: string | number;
}): string {
  if (analysisMode !== 'budget-window') {
    return startYear;
  }

  return formatBudgetWindowYear(startYear, Number.parseInt(String(budgetWindowYears), 10));
}

export function getBudgetWindowOptions(
  startYear: string,
  yearOptions: Array<{ value: string }>,
  countryId: CountryId
): string[] {
  const start = Number.parseInt(startYear, 10);

  if (Number.isNaN(start)) {
    return [String(getDefaultBudgetWindowYears(countryId))];
  }

  const availableYears = yearOptions
    .map((option) => Number.parseInt(option.value, 10))
    .filter((year) => !Number.isNaN(year))
    .sort((a, b) => a - b);

  const maxAvailableYear = availableYears[availableYears.length - 1];
  if (!maxAvailableYear || maxAvailableYear <= start) {
    return [];
  }

  const maxWindowSize = maxAvailableYear - start + 1;
  return Array.from({ length: maxWindowSize - 1 }, (_, index) => String(index + 2));
}

export function clampBudgetWindowYears(
  budgetWindowYears: string | number,
  availableOptions: string[],
  countryId: CountryId
): string {
  if (availableOptions.length === 0) {
    return String(getDefaultBudgetWindowYears(countryId));
  }

  const requested = String(budgetWindowYears);
  if (availableOptions.includes(requested)) {
    return requested;
  }

  const preferredDefault = String(getDefaultBudgetWindowYears(countryId));
  if (availableOptions.includes(preferredDefault)) {
    return preferredDefault;
  }

  return availableOptions[availableOptions.length - 1];
}

export function getReportTimingDisplay(reportYear: string): { label: string; value: string } {
  if (isBudgetWindowReportYear(reportYear)) {
    return {
      label: 'Budget window',
      value: reportYear,
    };
  }

  return {
    label: 'Year',
    value: reportYear,
  };
}
