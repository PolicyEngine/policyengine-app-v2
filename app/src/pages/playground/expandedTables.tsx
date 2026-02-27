import { useState } from 'react';
import { SegmentedControl, Stack, Table } from '@mantine/core';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { colors, spacing } from '@/designTokens';

interface TableProps {
  output: SocietyWideReportOutput;
}

const segmentedControlStyles = {
  root: {
    background: colors.gray[100],
    borderRadius: spacing.radius.md,
  },
  indicator: {
    background: colors.white,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
};

function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) {
    return `${sign}$${(abs / 1e12).toFixed(1)}T`;
  }
  if (abs >= 1e9) {
    return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  }
  return `${sign}$${abs.toLocaleString()}`;
}

function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatChange(baseline: number, reform: number): string {
  const change = reform - baseline;
  const sign = change > 0 ? '+' : '';
  return `${sign}${formatPercent(change)}`;
}

export function BudgetaryTable({ output }: TableProps) {
  const {
    tax_revenue_impact,
    state_tax_revenue_impact,
    benefit_spending_impact,
    budgetary_impact,
  } = output.budget;

  const rows = [
    { label: 'Federal tax revenues', value: tax_revenue_impact - state_tax_revenue_impact },
    { label: 'State and local income tax revenues', value: state_tax_revenue_impact },
    { label: 'Benefit spending', value: -benefit_spending_impact },
    { label: 'Net budgetary impact', value: budgetary_impact },
  ];

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Component</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Impact</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.label}>
            <Table.Td>{row.label}</Table.Td>
            <Table.Td
              style={{
                textAlign: 'right',
                color: row.value >= 0 ? colors.primary[600] : colors.gray[600],
                fontWeight: row.label.includes('Net') ? 600 : 400,
              }}
            >
              {formatCurrency(row.value)}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export function InequalityTable({ output }: TableProps) {
  const metrics = [
    { label: 'Gini index', ...output.inequality.gini },
    { label: 'Top 10% share', ...output.inequality.top_10_pct_share },
    { label: 'Top 1% share', ...output.inequality.top_1_pct_share },
  ];

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Metric</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Baseline</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Reform</Table.Th>
          <Table.Th style={{ textAlign: 'right' }}>Change</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {metrics.map((m) => {
          const relChange = m.reform / m.baseline - 1;
          return (
            <Table.Tr key={m.label}>
              <Table.Td>{m.label}</Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>{m.baseline.toFixed(3)}</Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>{m.reform.toFixed(3)}</Table.Td>
              <Table.Td
                style={{
                  textAlign: 'right',
                  color: relChange < 0 ? colors.primary[600] : colors.gray[600],
                }}
              >
                {formatPercent(relChange)}
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}

export function PovertyTable({ output }: TableProps) {
  const [depth, setDepth] = useState<'regular' | 'deep'>('regular');

  const povertyData = depth === 'deep' ? output.poverty.deep_poverty : output.poverty.poverty;
  const rows = [
    { label: 'Child', ...povertyData.child },
    { label: 'Adult', ...povertyData.adult },
    { label: 'Senior', ...povertyData.senior },
    { label: 'All', ...povertyData.all },
  ];

  return (
    <Stack gap={spacing.md}>
      <SegmentedControl
        value={depth}
        onChange={(v) => setDepth(v as 'regular' | 'deep')}
        size="xs"
        data={[
          { label: 'Regular poverty', value: 'regular' },
          { label: 'Deep poverty', value: 'deep' },
        ]}
        styles={segmentedControlStyles}
      />
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Group</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Baseline</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Reform</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Change</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr key={r.label}>
              <Table.Td>{r.label}</Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>{formatPercent(r.baseline)}</Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>{formatPercent(r.reform)}</Table.Td>
              <Table.Td
                style={{
                  textAlign: 'right',
                  color: r.reform < r.baseline ? colors.primary[600] : colors.gray[600],
                }}
              >
                {formatChange(r.baseline, r.reform)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}

export function DistributionalTable({ output }: TableProps) {
  const [mode, setMode] = useState<'absolute' | 'relative'>('absolute');

  const deciles = Object.keys(output.decile.average).sort((a, b) => Number(a) - Number(b));
  const data = mode === 'absolute' ? output.decile.average : output.decile.relative;

  return (
    <Stack gap={spacing.md}>
      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as 'absolute' | 'relative')}
        size="xs"
        data={[
          { label: 'Absolute', value: 'absolute' },
          { label: 'Relative', value: 'relative' },
        ]}
        styles={segmentedControlStyles}
      />
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Decile</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>
              {mode === 'absolute' ? 'Avg. income change' : 'Relative change'}
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {deciles.map((d) => {
            const value = data[d];
            return (
              <Table.Tr key={d}>
                <Table.Td>Decile {d}</Table.Td>
                <Table.Td
                  style={{
                    textAlign: 'right',
                    color: value >= 0 ? colors.primary[600] : colors.gray[600],
                  }}
                >
                  {mode === 'absolute' ? formatCurrency(value) : formatPercent(value)}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
