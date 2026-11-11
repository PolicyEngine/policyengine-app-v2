import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens';
import { householdCalculationError } from '@/utils/householdCalculationError';

export default function HouseholdVariationError({
  error,
  simulationRole,
}: {
  error: Error;
  simulationRole: 'baseline' | 'reform';
}) {
  const failure = householdCalculationError(error);
  return (
    <Stack gap="md" role="alert">
      <Text style={{ color: colors.error }}>
        Error loading {simulationRole} variation: {!failure.retryable && `[${failure.code}] `}
        {failure.message}
      </Text>
      {!failure.retryable && (
        <Text>
          Open report setup and update the {simulationRole} household’s SPM settings, geography,
          composition, or report year before calculating again.
        </Text>
      )}
    </Stack>
  );
}
