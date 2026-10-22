import SavedHouseholdsList from '@/components/flagship/household/SavedHouseholdsList';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

/**
 * v3's list of saved households, to rename or delete. Saved households
 * live on the Public API's `/v2/households` and `/v2/user-households`, so
 * no route renders this page until v3 moves to those routes.
 */
export default function SavedHouseholdsPage() {
  return (
    <Stack style={{ width: '100%', maxWidth: 880, gap: spacing.xl }}>
      <Stack style={{ gap: spacing.xs }}>
        <Title order={1} style={{ margin: 0 }}>
          Your households
        </Title>
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          Households you have saved. Choose one when you run a household report.
        </Text>
      </Stack>
      <SavedHouseholdsList />
    </Stack>
  );
}
