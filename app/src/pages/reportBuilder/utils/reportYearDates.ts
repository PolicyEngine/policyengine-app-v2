import { getParamDefinitionDate } from '@/constants';

export function getReportYearDateBounds(reportYear: string) {
  if (!reportYear) {
    throw new Error('[getReportYearDateBounds] reportYear is required');
  }

  return {
    reportYear,
    startDate: getParamDefinitionDate(reportYear),
    endDate: `${reportYear}-12-31`,
  };
}
