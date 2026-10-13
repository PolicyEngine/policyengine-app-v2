import { IconInfoCircle } from '@tabler/icons-react';
import { Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { sameParameterValue } from '@/libs/draftReform';
import { reportProvisionName } from '@/libs/flagship/draftLabels';
import type { RunReportProvision } from '@/libs/flagship/runReport';

/**
 * Why a provision changes nothing in the report's year, when its own
 * dates say so: it starts later, or it ended before that year.
 */
function datedReason(provision: RunReportProvision, year: number): string | null {
  const intervals = provision.intervals ?? [];
  if (intervals.length === 0) {
    return null;
  }
  const name = reportProvisionName(provision);
  const firstStart = Number(intervals[0].startDate.slice(0, 4));
  const lastEnd = Number(intervals[intervals.length - 1].endDate.slice(0, 4));
  if (firstStart > year) {
    return `${name} changes from ${firstStart}, after this ${year} report.`;
  }
  if (lastEnd < year) {
    return `${name} changes only until ${lastEnd}, before this ${year} report.`;
  }
  return null;
}

/**
 * A report whose reform changes nothing in its year: every result is
 * current law's. It says so first thing in the overview — not after a
 * page of zeros — with the reasons the provisions themselves give, then
 * the ones they can't (a program not in effect that year).
 */
export default function NoChangeNotice({
  year,
  provisions,
}: {
  /** The report's year, e.g. "2026" */
  year: string;
  provisions: RunReportProvision[];
}) {
  const yearNumber = Number(year);
  const reasons = Number.isFinite(yearNumber)
    ? provisions
        .map((provision) => datedReason(provision, yearNumber))
        .filter((reason): reason is string => !!reason)
    : [];
  // A provision at current law in the year, with no dates to explain it.
  const atCurrentLaw =
    reasons.length === 0 &&
    provisions.some((provision) => sameParameterValue(provision.value, provision.baselineValue));
  const yearText = year || 'the simulated year';
  const count = reasons.length + (atCurrentLaw ? 1 : 0) + (reasons.length === 0 ? 1 : 0);

  return (
    <section
      aria-label="No change in this year"
      style={{
        display: 'flex',
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.primary[200]}`,
        borderRadius: 12,
        background: colors.primary[50],
      }}
    >
      <IconInfoCircle
        size={20}
        aria-hidden
        style={{ flexShrink: 0, marginTop: 1, color: colors.primary[600] }}
      />
      <Stack style={{ gap: spacing.sm, minWidth: 0 }}>
        <Text
          style={{
            margin: 0,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          This reform changes nothing in {yearText}
        </Text>
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          Every result matches current law. {count > 1 ? 'Likely reasons:' : 'The likely reason:'}
        </Text>
        <ul
          style={{
            margin: 0,
            paddingLeft: spacing.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
          {atCurrentLaw && <li>A changed value is at current law in {yearText}.</li>}
          {reasons.length === 0 && (
            <li>
              A program you changed is not in effect in {yearText}: some credits start later or
              expire.
            </li>
          )}
        </ul>
      </Stack>
    </section>
  );
}
