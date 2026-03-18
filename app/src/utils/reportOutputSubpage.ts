type ReportOutputType = 'household' | 'societyWide';

const DEFAULT_SUBPAGES: Record<ReportOutputType, string> = {
  household: 'overview',
  societyWide: 'migration',
};

export function resolveDefaultReportOutputSubpage(
  outputType: ReportOutputType | undefined,
  subpage: string | undefined
) {
  if (subpage) {
    return subpage;
  }

  if (!outputType) {
    return '';
  }

  return DEFAULT_SUBPAGES[outputType];
}
