import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import type { BillChange } from '@/api/billFeed';
import ProvisionSkeleton from '@/components/flagship/ProvisionSkeleton';
import { CURRENT_YEAR, FOREVER } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { sameParameterValue } from '@/libs/draftReform';
import { changeNamesPath } from '@/libs/flagship/billProvisions';
import { dayLabel, describeChange, reportProvisionName } from '@/libs/flagship/draftLabels';
import type { RunReportProvision } from '@/libs/flagship/runReport';
import { RootState } from '@/store';
import { formatValue } from '@/utils/parameterValues';

/** Columns that show from the small breakpoint up; below it the values stack under the name. */
const WIDE_ONLY = 'tw:hidden tw:sm:table-cell';
/** The date columns need more room: they show from the medium breakpoint up. */
const DATES_WIDE = 'tw:hidden tw:md:table-cell';

const headerCell: React.CSSProperties = {
  padding: `0 ${spacing.md} ${spacing.sm}`,
  textAlign: 'right',
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
  whiteSpace: 'nowrap',
};

const bodyCell: React.CSSProperties = {
  padding: `${spacing.md} ${spacing.md}`,
  verticalAlign: 'top',
};

/** Before and after: right-aligned like the numbers they mostly are, wrapping when long. */
const valueCell: React.CSSProperties = {
  textAlign: 'right',
  minWidth: 88,
  maxWidth: 220,
  fontVariantNumeric: 'tabular-nums',
};

const dateCell: React.CSSProperties = {
  textAlign: 'right',
  whiteSpace: 'nowrap',
  color: colors.text.secondary,
  fontVariantNumeric: 'tabular-nums',
};

interface ChangeRow {
  key: string;
  name: string;
  /** What the change does, in words: the tracker's explanation or the parameter's description. */
  detail?: string;
  /** Where in the bill, e.g. "Section 1, amending C.G.S. § 12-700". */
  section?: string;
  before?: string;
  after: string;
  /** The value is today's law already, so there is no "before" to show. */
  currentLaw?: boolean;
  /** When the change applies (ISO dates); absent when it cannot be told. */
  dates?: ChangeDates;
}

interface ChangeDates {
  start: string;
  end: string;
}

/**
 * When a provision's change applies: its first dated value's start to
 * its last one's end — or, undated, from this year on, as it runs.
 */
function provisionDates(provision: Pick<RunReportProvision, 'intervals'>): ChangeDates {
  const intervals = provision.intervals ?? [];
  if (intervals.length === 0) {
    return { start: `${CURRENT_YEAR}-01-01`, end: FOREVER };
  }
  return {
    start: intervals.reduce(
      (min, i) => (i.startDate < min ? i.startDate : min),
      intervals[0].startDate
    ),
    end: intervals.reduce((max, i) => (i.endDate > max ? i.endDate : max), intervals[0].endDate),
  };
}

/**
 * What the reform changes, as a table: a row each with the change's
 * name and what it does, then its value before and after. A tracked
 * bill's rows are the changes as the tracker scored them; otherwise
 * each provision reads against today's law, with the parameter's own
 * description as its detail.
 *
 * An enacted bill without the tracker's rows is the exception: its
 * results compare with the law before it, but today's values already
 * include it, so there is no "before" to show. Its values read alone,
 * under a note that says what they are compared with.
 */
export default function ReportChanges({
  provisions,
  changes,
  priorLawBaseline = false,
  loading = false,
  beforeLabel = 'Before',
}: {
  provisions: RunReportProvision[];
  changes?: BillChange[];
  /** The parameters' names and units are still loading: placeholders, not raw paths. */
  loading?: boolean;
  /** The results compare with the law before the reform, which today's values include. */
  priorLawBaseline?: boolean;
  /** The first value column's heading: "Current law" when the results compare with something else. */
  beforeLabel?: string;
}) {
  const countryId = useCurrentCountry();
  // Dates as the country writes them: "Jan 1, 2026" in the US, "1 Jan 2026" in the UK.
  const dateText = (date: string) => dayLabel(date, countryId);
  const endText = (date: string) => (date === FOREVER ? 'No end date' : dateText(date));
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const variables = useSelector((state: RootState) => state.metadata.variables);
  const variableLabel = (name: string) => variables?.[name]?.label ?? name;

  const scored = Boolean(changes && changes.length > 0);
  // A tracker row has no dates of its own: it takes those of the parameter
  // it names, or the bill's when every provision shares one range.
  const allDates = provisions.map(provisionDates);
  const sharedDates =
    allDates.length > 0 &&
    allDates.every((d) => d.start === allDates[0].start && d.end === allDates[0].end)
      ? allDates[0]
      : undefined;
  const changeDates = (change: BillChange): ChangeDates | undefined => {
    const named = change.parameter
      ? provisions.filter((provision) => changeNamesPath(change.parameter!, provision.path))
      : [];
    if (named.length > 0) {
      const dates = named.map(provisionDates);
      return {
        start: dates.reduce((min, d) => (d.start < min ? d.start : min), dates[0].start),
        end: dates.reduce((max, d) => (d.end > max ? d.end : max), dates[0].end),
      };
    }
    return sharedDates;
  };
  const rows: ChangeRow[] =
    changes && changes.length > 0
      ? changes.map((change, index) => ({
          key: `${change.label}-${index}`,
          name: change.label,
          detail: change.explanation,
          section: change.section,
          before: change.before,
          after: change.after,
          dates: changeDates(change),
        }))
      : provisions.map((provision) => {
          const format = (value: unknown) => formatValue(value, provision.unit);
          const currentLaw = sameParameterValue(provision.baselineValue, provision.value);
          const list = Array.isArray(provision.value) && !currentLaw;
          return {
            key: provision.path,
            name: reportProvisionName(provision),
            detail: parameters?.[provision.path]?.description ?? undefined,
            // A set of variables reads as what it takes out and puts in.
            before: currentLaw || list ? undefined : format(provision.baselineValue),
            after: list
              ? describeChange(provision.baselineValue, provision.value, String, variableLabel)
              : format(provision.value),
            currentLaw,
            dates: provisionDates(provision),
          };
        });

  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="report-changes"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        padding: spacing['2xl'],
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
        background: colors.background.primary,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <h2
        id="report-changes"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          margin: 0,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
        }}
      >
        <IconAdjustmentsHorizontal size={24} stroke={1.5} color={colors.primary[700]} aria-hidden />
        Policy changes
      </h2>
      {!(loading && !scored) &&
        priorLawBaseline &&
        !scored &&
        rows.some((row) => row.before === undefined) && (
          <p
            style={{
              margin: 0,
              fontSize: typography.fontSize.sm,
              lineHeight: typography.lineHeight.relaxed,
              color: colors.text.secondary,
            }}
          >
            The values this bill sets. The estimates compare them with the law before the bill.
          </p>
        )}
      {loading && !scored ? (
        // The tracker's write-up needs no metadata; rows read from parameters do.
        <ProvisionSkeleton count={rows.length} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            <thead>
              <tr>
                <th scope="col" style={{ ...headerCell, textAlign: 'left', paddingLeft: 0 }}>
                  Change
                </th>
                <th scope="col" className={WIDE_ONLY} style={headerCell}>
                  {beforeLabel}
                </th>
                <th scope="col" className={WIDE_ONLY} style={headerCell}>
                  After
                </th>
                <th scope="col" className={DATES_WIDE} style={headerCell}>
                  Start
                </th>
                <th scope="col" className={DATES_WIDE} style={{ ...headerCell, paddingRight: 0 }}>
                  End
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} style={{ borderTop: `1px solid ${colors.border.light}` }}>
                  <th
                    scope="row"
                    style={{
                      ...bodyCell,
                      paddingLeft: 0,
                      textAlign: 'left',
                      fontWeight: typography.fontWeight.normal,
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                      }}
                    >
                      {row.name}
                    </span>
                    {row.detail && (
                      <span
                        style={{
                          display: 'block',
                          marginTop: 2,
                          lineHeight: typography.lineHeight.relaxed,
                          color: colors.text.secondary,
                        }}
                      >
                        {row.detail}
                      </span>
                    )}
                    {row.section && (
                      <span
                        style={{
                          display: 'block',
                          marginTop: 2,
                          fontSize: typography.fontSize.xs,
                          color: colors.text.tertiary,
                        }}
                      >
                        {row.section}
                      </span>
                    )}
                    {/* Narrow screens: the values under the name, not in columns. */}
                    <span
                      className="tw:block tw:sm:hidden"
                      style={{ marginTop: spacing.xs, color: colors.text.secondary }}
                    >
                      {row.before ?? '—'} →{' '}
                      <span
                        style={{
                          color: colors.primary[700],
                          fontWeight: typography.fontWeight.semibold,
                        }}
                      >
                        {row.after}
                      </span>
                    </span>
                    {/* Below the medium breakpoint the dates fold in too. */}
                    {row.dates && (
                      <span
                        className="tw:block tw:md:hidden"
                        style={{
                          marginTop: 2,
                          fontSize: typography.fontSize.xs,
                          color: colors.text.secondary,
                        }}
                      >
                        {row.dates.end === FOREVER
                          ? `From ${dateText(row.dates.start)}`
                          : `${dateText(row.dates.start)} – ${dateText(row.dates.end)}`}
                      </span>
                    )}
                  </th>
                  <td
                    className={WIDE_ONLY}
                    style={{ ...bodyCell, ...valueCell, color: colors.text.secondary }}
                  >
                    {row.before ?? '—'}
                  </td>
                  <td
                    className={WIDE_ONLY}
                    style={{
                      ...bodyCell,
                      ...valueCell,
                      color: colors.primary[700],
                      fontWeight: typography.fontWeight.semibold,
                    }}
                  >
                    {row.after}
                    {/* For a bill scored against the law before it, today's law is no "before". */}
                    {row.currentLaw && !priorLawBaseline && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.normal,
                          color: colors.text.secondary,
                        }}
                      >
                        current law
                      </span>
                    )}
                  </td>
                  <td className={DATES_WIDE} style={{ ...bodyCell, ...dateCell }}>
                    {row.dates ? dateText(row.dates.start) : '—'}
                  </td>
                  <td className={DATES_WIDE} style={{ ...bodyCell, ...dateCell, paddingRight: 0 }}>
                    {row.dates ? endText(row.dates.end) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
