import { useState } from 'react';
import { IconAdjustments, IconArrowRight } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import ParameterSearchBox from '@/components/flagship/ParameterSearchBox';
import { Button, Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { ParameterSearchEntry, selectParameterSearchEntries } from '@/libs/parameterSearch';
import { RootState } from '@/store';

/** Latest value whose start date is not in the future. */
function getCurrentValue(values: Record<string, any> | undefined): any {
  if (!values) {
    return undefined;
  }
  const today = new Date().toISOString().slice(0, 10);
  const applicable = Object.keys(values)
    .filter((date) => date <= today)
    .sort();
  const key = applicable[applicable.length - 1] ?? Object.keys(values).sort()[0];
  return key !== undefined ? values[key] : undefined;
}

function formatValue(value: any, unit: string | null): string {
  if (value === undefined || value === null) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'on' : 'off';
  }
  if (typeof value === 'number' && unit?.startsWith('currency-')) {
    const currency = unit === 'currency-GBP' ? '£' : '$';
    return `${currency}${value.toLocaleString()}`;
  }
  if (typeof value === 'number' && unit === '/1') {
    return `${(value * 100).toLocaleString()}%`;
  }
  return String(value);
}

/**
 * Build — the power-user entry point of the flagship shell.
 *
 * Universal parameter search fronts the existing policy creation
 * pathway: find any parameter by describing it, inspect it, then open
 * the editor. The same index will power the agent's locate stage.
 */
export default function BuildPage() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const entries = useSelector(selectParameterSearchEntries);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const [selected, setSelected] = useState<ParameterSearchEntry | null>(null);

  const selectedValues = selected ? parameters?.[selected.path]?.values : undefined;
  const currentValue = getCurrentValue(selectedValues ?? undefined);

  return (
    <Stack style={{ maxWidth: 720, margin: '0 auto', gap: spacing['2xl'] }}>
      <Stack style={{ gap: spacing.md, marginTop: spacing['3xl'] }}>
        <Title order={1}>Build a reform</Title>
        <Text style={{ color: colors.text.secondary }}>
          Search any of the {entries.length > 0 ? entries.length.toLocaleString() : ''} parameters
          in the model — tax rates, benefit amounts, thresholds, and phase-outs — then edit them
          into a reform.
        </Text>
      </Stack>

      {entries.length > 0 ? (
        <ParameterSearchBox entries={entries} onSelect={setSelected} />
      ) : (
        <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
          Loading the parameter index…
        </Text>
      )}

      {selected && (
        <Stack
          style={{
            gap: spacing.md,
            padding: spacing['2xl'],
            border: `1px solid ${colors.border.light}`,
            borderRadius: 12,
            background: colors.background.primary,
          }}
        >
          <Stack style={{ gap: spacing.xs }}>
            <Text
              style={{
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              {selected.breadcrumb || selected.label}
            </Text>
            <Text
              style={{
                fontSize: typography.fontSize.xs,
                fontFamily: typography.fontFamily.mono,
                color: colors.text.secondary,
                overflowWrap: 'anywhere',
              }}
            >
              {selected.path}
            </Text>
          </Stack>

          {selected.description && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              {selected.description}
            </Text>
          )}

          <Stack style={{ flexDirection: 'row', gap: spacing['2xl'] }}>
            <Stack style={{ gap: 2 }}>
              <Text
                style={{
                  fontSize: typography.fontSize.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: colors.text.secondary,
                }}
              >
                Current value
              </Text>
              <Text
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.primary[700],
                }}
              >
                {formatValue(currentValue, selected.unit)}
              </Text>
            </Stack>
            {selected.unit && (
              <Stack style={{ gap: 2 }}>
                <Text
                  style={{
                    fontSize: typography.fontSize.xs,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: colors.text.secondary,
                  }}
                >
                  Unit
                </Text>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
                  {selected.unit}
                </Text>
              </Stack>
            )}
          </Stack>

          <Stack style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button onClick={() => nav.push(`/${countryId}/policies/create`)}>
              Edit in a reform
              <IconArrowRight size={16} />
            </Button>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Clear
            </Button>
          </Stack>
        </Stack>
      )}

      <Stack
        style={{
          gap: spacing.lg,
          padding: spacing['2xl'],
          border: `1px solid ${colors.border.light}`,
          borderRadius: 12,
          background: colors.background.primary,
          alignItems: 'flex-start',
        }}
      >
        <IconAdjustments size={28} color={colors.primary[600]} />
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          Prefer to browse? The parameter editor walks the full policy tree. Your changes become a
          saved reform you can simulate, refine, and share.
        </Text>
        <Button variant="outline" onClick={() => nav.push(`/${countryId}/policies/create`)}>
          Open the parameter editor
          <IconArrowRight size={16} />
        </Button>
      </Stack>
    </Stack>
  );
}
