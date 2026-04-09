import {
  IconCalendarStats,
  IconScale,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer } from '@/components/ChartContainer';
import MetricCard from '@/components/report/MetricCard';
import { Group, Stack, Text } from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { colors, spacing, typography } from '@/designTokens';
import { countryIds } from '@/libs/countries';
import type {
  BudgetWindowAnnualImpact,
  BudgetWindowReportOutput,
} from '@/types/report/BudgetWindowReportOutput';
import { formatCurrencyAbbr } from '@/utils/formatters';
import { getBudgetWindowMetricLabels } from './budget-window/budgetWindowUtils';

interface BudgetWindowSubPageProps {
  output: BudgetWindowReportOutput;
  countryId: (typeof countryIds)[number];
}

function formatImpactValue(value: number, countryId: (typeof countryIds)[number]): string {
  return formatCurrencyAbbr(value, countryId, { maximumFractionDigits: 1 });
}

function MetricSummaryCard({
  icon,
  label,
  value,
  countryId,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  countryId: (typeof countryIds)[number];
}) {
  const trend = value === 0 ? 'neutral' : value > 0 ? 'positive' : 'negative';

  return (
    <div
      className="tw:flex tw:flex-col tw:gap-sm tw:rounded-container tw:border tw:bg-white"
      style={{
        borderColor: colors.border.light,
        padding: spacing.lg,
      }}
    >
      <Group gap="xs">
        <div
          className="tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full"
          style={{
            backgroundColor: trend === 'positive' ? colors.primary[50] : colors.gray[100],
            color: trend === 'positive' ? colors.primary[600] : colors.gray[600],
          }}
        >
          {icon}
        </div>
        <Text fw={typography.fontWeight.medium}>{label}</Text>
      </Group>
      <Text
        fw={typography.fontWeight.semibold}
        style={{
          fontSize: typography.fontSize.xl,
          color: trend === 'positive' ? colors.primary[700] : colors.gray[700],
        }}
      >
        {formatImpactValue(value, countryId)}
      </Text>
    </div>
  );
}

function BudgetWindowTooltip({
  active,
  payload,
  label,
  countryId,
}: {
  active?: boolean;
  payload?: Array<{ payload?: BudgetWindowAnnualImpact }>;
  label?: string;
  countryId: (typeof countryIds)[number];
}) {
  const annualImpact = payload?.[0]?.payload;

  if (!active || !annualImpact) {
    return null;
  }

  return (
    <div
      className="tw:rounded-lg tw:border tw:bg-white tw:shadow-lg"
      style={{ borderColor: colors.border.light, padding: spacing.md }}
    >
      <Text fw={typography.fontWeight.semibold}>{label}</Text>
      <Text size="sm">
        Net impact: {formatImpactValue(annualImpact.budgetaryImpact, countryId)}
      </Text>
      <Text size="sm">
        Tax revenue: {formatImpactValue(annualImpact.federalTaxRevenueImpact, countryId)}
      </Text>
      {annualImpact.stateTaxRevenueImpact !== 0 && (
        <Text size="sm">
          State tax: {formatImpactValue(annualImpact.stateTaxRevenueImpact, countryId)}
        </Text>
      )}
      <Text size="sm">
        Benefit spending: {formatImpactValue(-annualImpact.benefitSpendingImpact, countryId)}
      </Text>
    </div>
  );
}

export function BudgetWindowSubPage({ output, countryId }: BudgetWindowSubPageProps) {
  const metricLabels = getBudgetWindowMetricLabels(countryId);
  const showStateTaxColumn =
    countryId === 'us' || output.annualImpacts.some((impact) => impact.stateTaxRevenueImpact !== 0);
  const chartData = output.annualImpacts.map((impact) => ({
    ...impact,
    impactInBillions: impact.budgetaryImpact / 1e9,
  }));
  const totalImpact = output.totals.budgetaryImpact;

  return (
    <Stack gap="xl">
      <Stack gap="sm">
        <MetricCard
          label={`${output.windowSize}-year budget impact`}
          value={formatImpactValue(totalImpact, countryId)}
          subtext={`${output.startYear}-${output.endYear}`}
          trend={totalImpact === 0 ? 'neutral' : totalImpact > 0 ? 'positive' : 'negative'}
          hero
        />
        <Text size="sm" c={colors.text.secondary}>
          Budget-window mode aggregates fiscal impacts year by year. Distributional, poverty, and
          inequality analysis remain single-year.
        </Text>
      </Stack>

      <div className="tw:grid tw:grid-cols-1 tw:gap-md lg:tw:grid-cols-3">
        <MetricSummaryCard
          icon={<IconTrendingUp size={18} />}
          label={metricLabels.federalTax}
          value={output.totals.federalTaxRevenueImpact}
          countryId={countryId}
        />
        <MetricSummaryCard
          icon={<IconTrendingDown size={18} />}
          label={metricLabels.benefits}
          value={-output.totals.benefitSpendingImpact}
          countryId={countryId}
        />
        <MetricSummaryCard
          icon={<IconScale size={18} />}
          label={metricLabels.netBudget}
          value={output.totals.budgetaryImpact}
          countryId={countryId}
        />
      </div>

      <ChartContainer title="Annual net budget impact">
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  formatCurrencyAbbr(value * 1e9, countryId, { maximumFractionDigits: 0 })
                }
              />
              <Tooltip content={<BudgetWindowTooltip countryId={countryId} />} />
              <Bar dataKey="impactInBillions" radius={[8, 8, 0, 0]}>
                {chartData.map((impact) => (
                  <Cell
                    key={impact.year}
                    fill={impact.budgetaryImpact >= 0 ? colors.primary[600] : colors.gray[500]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartContainer>

      <Stack gap="sm">
        <Group gap="xs">
          <IconCalendarStats size={18} color={colors.primary[600]} />
          <Text fw={typography.fontWeight.medium}>Annual detail</Text>
        </Group>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="tw:text-right">{metricLabels.federalTax}</TableHead>
              {showStateTaxColumn && (
                <TableHead className="tw:text-right">{metricLabels.stateTax}</TableHead>
              )}
              <TableHead className="tw:text-right">{metricLabels.benefits}</TableHead>
              <TableHead className="tw:text-right">{metricLabels.netBudget}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {output.annualImpacts.map((impact) => (
              <TableRow key={impact.year}>
                <TableCell>{impact.year}</TableCell>
                <TableCell className="tw:text-right">
                  {formatImpactValue(impact.federalTaxRevenueImpact, countryId)}
                </TableCell>
                {showStateTaxColumn && (
                  <TableCell className="tw:text-right">
                    {formatImpactValue(impact.stateTaxRevenueImpact, countryId)}
                  </TableCell>
                )}
                <TableCell className="tw:text-right">
                  {formatImpactValue(-impact.benefitSpendingImpact, countryId)}
                </TableCell>
                <TableCell className="tw:text-right">
                  {formatImpactValue(impact.budgetaryImpact, countryId)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="tw:text-right">
                {formatImpactValue(output.totals.federalTaxRevenueImpact, countryId)}
              </TableCell>
              {showStateTaxColumn && (
                <TableCell className="tw:text-right">
                  {formatImpactValue(output.totals.stateTaxRevenueImpact, countryId)}
                </TableCell>
              )}
              <TableCell className="tw:text-right">
                {formatImpactValue(-output.totals.benefitSpendingImpact, countryId)}
              </TableCell>
              <TableCell className="tw:text-right">
                {formatImpactValue(output.totals.budgetaryImpact, countryId)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Stack>
    </Stack>
  );
}
