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
 * its baseline's — current law's, or the saved reform's it is compared
 * with. It says so first thing in the overview — not after a page of
 * zeros — with the reasons the provisions themselves give, then the
 * ones they can't (a program not in effect that year). Against a saved
 * reform, the reasons are only those that compare with it.
 */
export default function NoChangeNotice({
  year,
  provisions,
  baselineLabel,
}: {
  /** The report's year, e.g. "2026" */
  year: string;
  provisions: RunReportProvision[];
  /** What the report is compared with, by name; current law when unset. */
  baselineLabel?: string | null;
}) {
  const yearNumber = Number(year);
  // The provisions' dates and current-law values explain a match with
  // current law, not with a saved reform.
  const reasons =
    !baselineLabel && Number.isFinite(yearNumber)
      ? provisions
          .map((provision) => datedReason(provision, yearNumber))
          .filter((reason): reason is string => !!reason)
      : [];
  // A provision at current law in the year, with no dates to explain it.
  const atCurrentLaw =
    !baselineLabel &&
    reasons.length === 0 &&
    provisions.some((provision) => sameParameterValue(provision.value, provision.baselineValue));
  const yearText = year || 'the simulated year';
  const allReasons = [
    ...reasons,
    ...(baselineLabel
      ? [`The reform sets the same values as ${baselineLabel} in ${yearText}.`]
      : []),
    ...(atCurrentLaw ? [`A changed value is at current law in ${yearText}.`] : []),
    ...(reasons.length === 0
      ? [
          `A program you changed is not in effect in ${yearText}: some credits start later or expire.`,
        ]
      : []),
  ];
  const textStyle = {
    margin: 0,
    fontSize: typography.fontSize.sm,
    lineHeight: 1.5,
    color: colors.text.secondary,
  };

  return (
    <section
      aria-label="No change in this year"
      style={{
        display: 'flex',
        gap: spacing.md,
        padding: `${spacing.md} ${spacing.lg}`,
        border: `1px solid ${colors.primary[200]}`,
        borderRadius: 12,
        background: colors.primary[50],
      }}
    >
      <IconInfoCircle
        size={18}
        aria-hidden
        style={{ flexShrink: 0, marginTop: 2, color: colors.primary[600] }}
      />
      <Stack style={{ gap: spacing.xs, minWidth: 0 }}>
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
        {allReasons.length === 1 ? (
          // One reason reads as one sentence, with no list around it.
          <Text style={textStyle}>
            Every result matches {baselineLabel || 'current law'}. {allReasons[0]}
          </Text>
        ) : (
          <>
            <Text style={textStyle}>
              Every result matches {baselineLabel || 'current law'}. Likely reasons:
            </Text>
            <ul
              style={{
                ...textStyle,
                paddingLeft: spacing.lg,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}
            >
              {allReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </>
        )}
      </Stack>
    </section>
  );
}
