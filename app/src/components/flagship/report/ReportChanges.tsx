import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import type { BillChange } from '@/api/billFeed';
import { colors, spacing, typography } from '@/designTokens';
import { sameParameterValue } from '@/libs/draftReform';
import { describeChange, provisionName } from '@/libs/flagship/draftLabels';
import type { RunReportProvision } from '@/libs/flagship/runReport';
import { RootState } from '@/store';
import { formatValue } from '@/utils/parameterValues';

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
}

/**
 * What the reform changes, a row each: the change's name, what it does,
 * and its value before and after. A tracked bill's rows are the changes
 * as the tracker scored them; otherwise each provision reads against
 * today's law, with the parameter's own description as its detail.
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
}: {
  provisions: RunReportProvision[];
  changes?: BillChange[];
  /** The results compare with the law before the reform, which today's values include. */
  priorLawBaseline?: boolean;
}) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const variables = useSelector((state: RootState) => state.metadata.variables);
  const variableLabel = (name: string) => variables?.[name]?.label ?? name;

  const scored = Boolean(changes && changes.length > 0);
  const rows: ChangeRow[] =
    changes && changes.length > 0
      ? changes.map((change, index) => ({
          key: `${change.label}-${index}`,
          name: change.label,
          detail: change.explanation,
          section: change.section,
          before: change.before,
          after: change.after,
        }))
      : provisions.map((provision) => {
          const format = (value: unknown) => formatValue(value, provision.unit);
          const currentLaw = sameParameterValue(provision.baselineValue, provision.value);
          const list = Array.isArray(provision.value) && !currentLaw;
          return {
            key: provision.path,
            name: provision.path.startsWith('gov.irs.credits.ctc.amount.base')
              ? 'Maximum credit per child'
              : provisionName(provision),
            detail: parameters?.[provision.path]?.description ?? undefined,
            // A set of variables reads as what it takes out and puts in.
            before: currentLaw || list ? undefined : format(provision.baselineValue),
            after: list
              ? describeChange(provision.baselineValue, provision.value, String, variableLabel)
              : format(provision.value),
            currentLaw,
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
      {priorLawBaseline && !scored && rows.some((row) => row.before === undefined) && (
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
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {rows.map((row, index) => (
          <li
            key={row.key}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              columnGap: spacing.xl,
              rowGap: spacing.xs,
              padding: `${spacing.md} 0`,
              borderTop: index > 0 ? `1px solid ${colors.border.light}` : 'none',
            }}
          >
            <div
              style={{
                flex: '1 1 320px',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}
              >
                {row.name}
              </span>
              {row.detail && (
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    lineHeight: typography.lineHeight.relaxed,
                    color: colors.text.secondary,
                  }}
                >
                  {row.detail}
                </span>
              )}
              {row.section && (
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  {row.section}
                </span>
              )}
            </div>
            <div
              style={{
                flex: '0 1 auto',
                maxWidth: '100%',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                textAlign: 'right',
              }}
            >
              {row.before !== undefined && <>{row.before} → </>}
              <span
                style={{ color: colors.primary[700], fontWeight: typography.fontWeight.semibold }}
              >
                {row.after}
              </span>
              {/* For a bill scored against the law before it, today's law is no "before". */}
              {row.currentLaw && !priorLawBaseline && (
                <span style={{ marginLeft: spacing.xs, fontSize: typography.fontSize.xs }}>
                  current law
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
