type ReportOutputType = 'household' | 'societyWide';

const DEFAULT_SUBPAGES: Record<ReportOutputType, string> = {
  household: 'overview',
  societyWide: 'migration',
};

export function resolveDefaultReportOutputSubpage(
  outputType: ReportOutputType | undefined,
  subpage: string | undefined,
  options?: {
    societyWideDefaultSubpage?: string;
  }
) {
  if (subpage) {
    return subpage;
  }

  if (!outputType) {
    return '';
  }

  if (outputType === 'societyWide' && options?.societyWideDefaultSubpage) {
    return options.societyWideDefaultSubpage;
  }

  return DEFAULT_SUBPAGES[outputType];
}
