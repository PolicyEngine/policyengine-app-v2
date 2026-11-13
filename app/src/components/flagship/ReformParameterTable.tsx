import { useSelector } from 'react-redux';
import { ErrorState, SkeletonLine, SkeletonRegion } from '@/components/flagship/states';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { yearReadDate } from '@/libs/draftReform';
import { periodLabel } from '@/libs/flagship/draftLabels';
import type { RootState } from '@/store';
import type { Parameter } from '@/types/subIngredients/parameter';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

/** A saved reform's parameter rows: name, current law, the reform's value, when it starts. */
export const PARAMETER_ROW: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(88px, 140px) minmax(120px, 180px) minmax(64px, 96px)',
  alignItems: 'center',
  columnGap: spacing.md,
  padding: `${spacing.sm} 0`,
  borderBottom: `1px solid ${colors.border.light}`,
};

export const PARAMETER_HEADING: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
};

export const PARAMETER_VALUE: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.primary,
  fontVariantNumeric: 'tabular-nums',
};

const PARAMETER_MUTED: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

/** A value as the row reads it: True/False, as Build's switch says. */
export function displayValue(value: unknown, unit: string | null): string {
  return typeof value === 'boolean' ? (value ? 'True' : 'False') : formatValue(value, unit);
}

/**
 * A parameter's place in the model, as "Program → … → Name", from the
 * loaded metadata; `fallback` (else the path) when it is not loaded.
 */
export function parameterBreadcrumb(
  path: string,
  parameters: RootState['metadata']['parameters'],
  fallback?: string
): string {
  return parameters?.[path]
    ? formatLabelParts(getHierarchicalLabels(path, parameters))
    : (fallback ?? path);
}

interface ReformParameterTableProps {
  /** The reform's parameters, each with the periods it sets. */
  reformParameters: Parameter[];
  /** The heading of the reform's own values, such as "Your reform". */
  reformHeading: string;
  /** Whether the parameters' names and current law have loaded. */
  metadataReady: boolean;
  /** Whether loading them failed: the table gives way to a retry. */
  metadataFailed: boolean;
  onRetryMetadata: () => void;
  /**
   * Show the parameters without the page's metadata: by their paths,
   * without current law or units. For a policy saved in another country,
   * whose parameters the page's country's model can't describe.
   */
  withoutMetadata?: boolean;
}

/** No parameters' metadata, for a table shown without it. */
const NO_PARAMETER_METADATA: RootState['metadata']['parameters'] = {};

/**
 * A saved reform's parameters, read only: each parameter's name and place
 * in the model, then, for each period the reform sets, current law in that
 * period's first year, the reform's value and when the period starts.
 * Names and current law come from the current country's loaded metadata.
 */
export default function ReformParameterTable({
  reformParameters,
  reformHeading,
  metadataReady,
  metadataFailed,
  onRetryMetadata,
  withoutMetadata = false,
}: ReformParameterTableProps) {
  const countryId = useCurrentCountry();
  const storeParameters = useSelector((state: RootState) => state.metadata.parameters);
  const parameters = withoutMetadata ? NO_PARAMETER_METADATA : storeParameters;

  /** Current law for a parameter in `year`. */
  const currentLawAt = (path: string, year: number) => {
    const values = parameters?.[path]?.values;
    return values
      ? (new ValueIntervalCollection(values).getValueAtDate(yearReadDate(year, countryId)) ??
          getCurrentValue(values))
      : undefined;
  };

  if (metadataFailed) {
    return <ErrorState compact title="Could not load the parameters" onRetry={onRetryMetadata} />;
  }
  return (
    <div role="table" aria-label="Parameters">
      <div role="row" style={{ ...PARAMETER_ROW, paddingTop: 0 }}>
        {['Parameter', 'Current law', reformHeading, 'From'].map((heading) => (
          <span key={heading} role="columnheader" style={PARAMETER_HEADING}>
            {heading}
          </span>
        ))}
      </div>
      {!metadataReady ? (
        // Names and current law come with the model's metadata: until
        // then each row holds its place, rather than empty boxes.
        <SkeletonRegion label="Loading parameters">
          {reformParameters.map((parameter) => (
            <div key={parameter.name} style={PARAMETER_ROW}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SkeletonLine width="60%" />
                <SkeletonLine width="40%" height={10} />
              </div>
              <SkeletonLine width={56} />
              <SkeletonLine width={64} />
              <SkeletonLine width={64} />
            </div>
          ))}
        </SkeletonRegion>
      ) : (
        reformParameters.map((parameter) => {
          const unit = parameters[parameter.name]?.unit ?? null;
          const first = parameter.values[0];
          // Current law where the change starts, not today.
          const baseline = first
            ? currentLawAt(parameter.name, Number(first.startDate.slice(0, 4)))
            : getCurrentValue(parameters[parameter.name]?.values);
          // One row per period the reform sets, each read against
          // current law in its own first year.
          const periods = parameter.values.length > 0 ? parameter.values : [];
          const breadcrumb = parameterBreadcrumb(parameter.name, parameters);
          const parts = breadcrumb.split(' → ');
          const name = parts[parts.length - 1] ?? parameter.name;
          const context = parts.slice(0, -1).join(' → ');
          const nameCell = (
            <div role="cell" style={{ minWidth: 0 }} title={breadcrumb}>
              <Text
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.sm,
                  lineHeight: '20px',
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}
              >
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Text>
              {context && (
                <Text
                  className="tw:truncate"
                  style={{
                    margin: 0,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                  }}
                >
                  {context}
                </Text>
              )}
            </div>
          );
          if (periods.length === 0) {
            return (
              <div key={parameter.name} role="row" style={PARAMETER_ROW}>
                {nameCell}
                <span role="cell" style={PARAMETER_MUTED}>
                  {displayValue(baseline, unit)}
                </span>
                <span role="cell" style={PARAMETER_VALUE} />
                <span role="cell" style={PARAMETER_MUTED} />
              </div>
            );
          }
          // Each column lists the periods, one line each, so a period
          // reads straight across; the name sits at the top.
          const column = (
            render: (period: (typeof periods)[number]) => React.ReactNode,
            style: React.CSSProperties
          ) => (
            <span
              role="cell"
              style={{
                ...style,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
              }}
            >
              {periods.map((period) => (
                <span key={period.startDate} style={{ lineHeight: '20px' }}>
                  {render(period)}
                </span>
              ))}
            </span>
          );
          return (
            <div key={parameter.name} role="row" style={{ ...PARAMETER_ROW, alignItems: 'start' }}>
              {nameCell}
              {column(
                (period) =>
                  displayValue(
                    currentLawAt(parameter.name, Number(period.startDate.slice(0, 4))),
                    unit
                  ),
                PARAMETER_MUTED
              )}
              {column((period) => displayValue(period.value, unit), PARAMETER_VALUE)}
              {column((period) => periodLabel(period, countryId), PARAMETER_MUTED)}
            </div>
          );
        })
      )}
    </div>
  );
}
