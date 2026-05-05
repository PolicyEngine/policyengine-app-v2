/**
 * Shared utilities for inequality impact chart title and CSV export.
 */

import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { MetadataState } from '@/types/metadata';
import type { CsvData } from '@/utils/chartUtils';
import { regionName } from '@/utils/impactChartUtils';

export function getInequalityTitle(
  output: SocietyWideReportOutput,
  metadata: MetadataState
): string {
  const giniImpact = output.inequality.gini;
  const top10Impact = output.inequality.top_10_pct_share;
  const top1Impact = output.inequality.top_1_pct_share;

  const metricChanges = [
    giniImpact.reform / giniImpact.baseline - 1,
    top10Impact.reform / top10Impact.baseline - 1,
    top1Impact.reform / top1Impact.baseline - 1,
  ];

  const signTerm =
    metricChanges[0] > 0 && metricChanges[1] > 0 && metricChanges[2] > 0
      ? 'increase'
      : metricChanges[0] < 0 && metricChanges[1] < 0 && metricChanges[2] < 0
        ? 'decrease'
        : 'have an ambiguous effect on';
  const region = regionName(metadata);
  const regionPhrase = region ? ` in ${region}` : '';
  return `This reform would ${signTerm} income inequality${regionPhrase}`;
}

export function getInequalityCsvRows(output: SocietyWideReportOutput): CsvData {
  const metrics = [
    ['Gini index', output.inequality.gini],
    ['Top 10% share', output.inequality.top_10_pct_share],
    ['Top 1% share', output.inequality.top_1_pct_share],
  ] as const;

  return [
    ['Metric', 'Baseline', 'Reform', 'Change'],
    ...metrics.map(([label, impact]) => [
      label,
      impact.baseline,
      impact.reform,
      impact.baseline === 0 ? null : impact.reform / impact.baseline - 1,
    ]),
  ];
}
