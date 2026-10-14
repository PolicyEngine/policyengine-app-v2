import { useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import HouseholdForm from '@/components/flagship/report/household/HouseholdForm';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import RunProgress from '@/components/flagship/report/RunProgress';
import { Button, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useFlagshipHousehold } from '@/hooks/useFlagshipHousehold';
import {
  defaultHouseholdInput,
  describeHouseholdInput,
  type FlagshipHouseholdInput,
} from '@/libs/flagship/householdRun';

/** Both policies run at once; one household typically takes under a minute. */
const EXPECTED_MS = 45 * 1000;

const sameInput = (a: FlagshipHouseholdInput | null, b: FlagshipHouseholdInput) =>
  !!a && JSON.stringify(a) === JSON.stringify(b);

interface HouseholdImpactSectionProps {
  countryId: string;
  /** The report's year: the household runs in it. */
  year: string;
  /** The report's population; a state's report starts the household there. */
  region?: string;
  baselinePolicyId: string;
  reformPolicyId: string;
}

/**
 * The report's household section: describe one household, then see how
 * the report's reform changes its net income against the report's
 * baseline, in the report's year. Nothing runs until "Calculate".
 */
export default function HouseholdImpactSection({
  countryId,
  year,
  region,
  baselinePolicyId,
  reformPolicyId,
}: HouseholdImpactSectionProps) {
  const [draft, setDraft] = useState(() => defaultHouseholdInput(region));
  const [requested, setRequested] = useState<FlagshipHouseholdInput | null>(null);
  const run = useFlagshipHousehold({ year, baselinePolicyId, reformPolicyId, input: requested });

  if (countryId !== 'us') {
    return (
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        Household impacts are available for US reports.
      </Text>
    );
  }

  const running = !!requested && run.isFetching;
  const failed = !!requested && !running && run.isError;
  const result = requested && !running ? run.data : undefined;

  return (
    <Stack style={{ gap: spacing.lg }}>
      <div
        style={{
          padding: spacing.lg,
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.radius.container,
          background: colors.secondary[50],
        }}
      >
        <HouseholdForm
          value={draft}
          onChange={setDraft}
          onSubmit={() =>
            // The same household again, after a failure, asks once more.
            sameInput(requested, draft) ? void run.refetch() : setRequested(draft)
          }
          // The household on screen, or on its way, is the one in the form.
          submitDisabled={running || (sameInput(requested, draft) && !failed)}
        />
      </div>

      {running && <RunProgress title="Calculating this household" expectedMs={EXPECTED_MS} />}

      {failed && (
        <section
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing.md,
            padding: spacing.lg,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.container,
            background: colors.background.primary,
          }}
        >
          <IconAlertTriangle size={20} aria-hidden style={{ flexShrink: 0, color: colors.error }} />
          <Stack style={{ gap: spacing.sm, alignItems: 'flex-start', minWidth: 0 }}>
            <Text
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              This household could not be calculated.
            </Text>
            {run.error?.message && (
              <Text
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  overflowWrap: 'anywhere',
                }}
              >
                {run.error.message}
              </Text>
            )}
            <Button size="sm" variant="outline" onClick={() => void run.refetch()}>
              Try again
            </Button>
          </Stack>
        </section>
      )}

      {result && requested && (
        <HouseholdImpactResult
          impact={result}
          summary={`${describeHouseholdInput(requested)} · ${year}`}
        />
      )}
    </Stack>
  );
}
