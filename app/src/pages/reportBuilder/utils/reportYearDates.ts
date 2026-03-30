import { CURRENT_YEAR, getParamDefinitionDate } from '@/constants';

export function getReportYearDateBounds(reportYear?: string, fallbackYear: string = CURRENT_YEAR) {
  const resolvedReportYear = reportYear || fallbackYear;

  return {
    reportYear: resolvedReportYear,
    startDate: getParamDefinitionDate(resolvedReportYear),
    endDate: `${resolvedReportYear}-12-31`,
  };
}
