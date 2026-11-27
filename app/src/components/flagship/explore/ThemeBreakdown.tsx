import type { ReactNode } from 'react';
import { colors, spacing, typography } from '@/designTokens';
import type { BaselineMetricKey, BaselineRegion } from '@/libs/flagship/explore/baselineData';
import {
  CARD_ONLY_FORMATS,
  isShownAt,
  themeMetrics,
  unitPlural,
  type ExploreMetric,
  type ShownLevel,
} from '@/libs/flagship/explore/exploreMetrics';

interface ThemeBreakdownProps {
  place: BaselineRegion;
  /** The place's level: a measure hidden there stays out of the breakdowns. */
  level: ShownLevel;
  metric: ExploreMetric;
  onMetricChange: (key: BaselineMetricKey) => void;
}

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const thousands = (value: number) =>
  `${value < 0 ? '−' : ''}$${Math.round(Math.abs(value) / 100) / 10}k`;

const TAX_COLOR = colors.gray[400];
const BENEFIT_COLOR = colors.primary[400];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      style={{
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTop: `1px solid ${colors.border.light}`,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
        }}
      >
        {title}
      </h3>
      {note && (
        <p
          style={{
            margin: '2px 0 0',
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
          }}
        >
          {note}
        </p>
      )}
      <div style={{ marginTop: spacing.sm }}>{children}</div>
    </section>
  );
}

/** One labeled bar; `share` is the bar's length from 0 to 1. */
function BarRow({
  label,
  value,
  share,
  color = colors.primary[300],
  current,
  onClick,
}: {
  label: string;
  value: string;
  share: number;
  color?: string;
  current?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span>{label}</span>
      <span aria-hidden style={{ background: colors.gray[100], height: 8, borderRadius: 2 }}>
        <span
          style={{
            display: 'block',
            height: 8,
            borderRadius: 2,
            width: `${Math.max(0, Math.min(1, share)) * 100}%`,
            background: current ? colors.primary[600] : color,
          }}
        />
      </span>
      <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </>
  );
  const style = {
    display: 'grid',
    gridTemplateColumns: '110px 1fr 56px',
    gap: spacing.sm,
    alignItems: 'center',
    width: '100%',
    padding: '2px 0',
    border: 0,
    background: 'none',
    textAlign: 'left' as const,
    fontSize: typography.fontSize.xs,
    color: colors.gray[700],
    fontWeight: current ? typography.fontWeight.semibold : undefined,
  };
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-current={current || undefined}
      className="tw:cursor-pointer tw:hover:bg-gray-50"
      style={style}
    >
      {content}
    </button>
  ) : (
    <div style={style}>{content}</div>
  );
}

/** Taxes to the left of a center line, benefits to the right, for each income decile. */
function DecileTaxesAndBenefits({ place }: { place: BaselineRegion }) {
  const deciles = place.deciles ?? [];
  const taxes = deciles.map((d) => d.federal_income_tax + d.payroll_tax + d.state_income_tax);
  const max = Math.max(...taxes.map(Math.abs), ...deciles.map((d) => d.benefits), 1);
  return (
    <div role="table" aria-label="Average taxes and benefits per household by income decile">
      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr 1fr',
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
          marginBottom: 2,
        }}
      >
        <span role="columnheader">Decile</span>
        <span role="columnheader" style={{ textAlign: 'right', paddingRight: 4 }}>
          Taxes paid
        </span>
        <span role="columnheader" style={{ paddingLeft: 4 }}>
          Benefits received
        </span>
      </div>
      {deciles.map((d, i) => (
        <div
          key={i}
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 1fr',
            alignItems: 'center',
            fontSize: typography.fontSize.xs,
            color: colors.gray[700],
            padding: '1px 0',
          }}
        >
          <span role="rowheader">{i + 1}</span>
          <span
            role="cell"
            title={thousands(taxes[i])}
            style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 2 }}
          >
            <span
              style={{
                height: 8,
                width: `${(Math.abs(taxes[i]) / max) * 100}%`,
                background: taxes[i] < 0 ? colors.primary[200] : TAX_COLOR,
                borderRadius: 2,
              }}
            />
            <span className="tw:sr-only">{thousands(taxes[i])}</span>
          </span>
          <span role="cell" title={thousands(d.benefits)} style={{ paddingLeft: 2 }}>
            <span
              style={{
                display: 'block',
                height: 8,
                width: `${(d.benefits / max) * 100}%`,
                background: BENEFIT_COLOR,
                borderRadius: 2,
              }}
            />
            <span className="tw:sr-only">{thousands(d.benefits)}</span>
          </span>
        </div>
      ))}
      <p
        style={{
          margin: `${spacing.xs} 0 0`,
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
        }}
      >
        Poorest tenth: {thousands(taxes[0] ?? 0)} in taxes, {thousands(deciles[0]?.benefits ?? 0)}{' '}
        in benefits. Richest tenth: {thousands(taxes[9] ?? 0)} in taxes,{' '}
        {thousands(deciles[9]?.benefits ?? 0)} in benefits.
      </p>
    </div>
  );
}

/**
 * The card's breakdown for the measure's theme, from what the region's
 * figures hold: districts have no deciles or groups, so some themes show
 * nothing there.
 */
export default function ThemeBreakdown({
  place,
  level,
  metric,
  onMetricChange,
}: ThemeBreakdownProps) {
  if (metric.theme === 'poverty' && place.poverty_by_group) {
    const groups = place.poverty_by_group;
    const rows: [string, number | undefined][] = [
      ['Children', groups.children],
      ['Working age', groups.working_age],
      ['Women', groups.women],
      ['Men', groups.men],
    ];
    const max = Math.max(...rows.map(([, v]) => v ?? 0), 0.01);
    return (
      <Section title="Poverty by group" note="SPM poverty rate; women and men are adults.">
        {rows.map(([label, value]) =>
          value === undefined ? null : (
            <BarRow key={label} label={label} value={percent(value)} share={value / max} />
          )
        )}
      </Section>
    );
  }

  if ((metric.theme === 'income' || metric.theme === 'inequality') && place.deciles) {
    const nets = place.deciles.map((d) => d.net_income);
    const max = Math.max(...nets, 1);
    return (
      <Section
        title="Income by decile"
        note="Average household income after taxes and benefits, poorest tenth of households first."
      >
        {nets.map((net, i) => (
          <BarRow key={i} label={`Decile ${i + 1}`} value={thousands(net)} share={net / max} />
        ))}
      </Section>
    );
  }

  if (metric.theme === 'taxes' && place.deciles) {
    const quintiles = place.state_tax_by_quintile ?? [];
    const max = Math.max(...quintiles.map(Math.abs), 0.001);
    return (
      <>
        {quintiles.length > 0 && (
          <Section
            title="State income tax rate by income"
            note="Share of income before taxes, by fifth of households from poorest to richest."
          >
            {quintiles.map((value, i) => (
              <BarRow
                key={i}
                label={['Poorest fifth', 'Second', 'Middle', 'Fourth', 'Richest fifth'][i]}
                value={percent(value)}
                share={Math.abs(value) / max}
                color={value < 0 ? colors.primary[200] : colors.primary[300]}
              />
            ))}
          </Section>
        )}
        <Section
          title="Where taxes and benefits fall"
          note="Average per household by income decile: federal, payroll and state taxes, and benefits."
        >
          <DecileTaxesAndBenefits place={place} />
        </Section>
      </>
    );
  }

  if (metric.theme === 'benefits') {
    const programs = themeMetrics('benefits')
      .filter((m) => isShownAt(m, level))
      .map((m) => ({ m, value: place.metrics[m.key] }))
      .filter((row): row is { m: ExploreMetric; value: number } => row.value !== undefined)
      .sort((a, b) => b.value - a.value);
    if (!programs.length) {
      return null;
    }
    const max = Math.max(...programs.map((row) => row.value), 0.01);
    const eitc = place.metrics.eitc_per_recipient;
    const ctc = place.metrics.ctc_per_recipient;
    const format = CARD_ONLY_FORMATS.eitc_per_recipient;
    return (
      <Section
        title="Reach of each program"
        note="Share of the unit each program pays: people, households or tax units. Click one to map it."
      >
        {programs.map(({ m, value }) => (
          <BarRow
            key={m.key}
            label={`${m.label.replace(/^the /, '')}${m.recipients ? ` (${unitPlural(m.recipients.unit)})` : ''}`}
            value={percent(value)}
            share={value / max}
            current={m.key === metric.key}
            onClick={() => onMetricChange(m.key)}
          />
        ))}
        {format && (eitc !== undefined || ctc !== undefined) && (
          <p
            style={{
              margin: `${spacing.sm} 0 0`,
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Average per claiming tax unit:
            {eitc !== undefined ? ` EITC ${format(eitc)}` : ''}
            {ctc !== undefined ? `${eitc !== undefined ? ',' : ''} CTC ${format(ctc)}` : ''}.
          </p>
        )}
      </Section>
    );
  }

  return null;
}
