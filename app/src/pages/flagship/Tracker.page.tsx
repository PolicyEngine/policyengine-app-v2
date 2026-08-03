import { IconExternalLink, IconGavel } from '@tabler/icons-react';
import { Button, Stack, Text, Title } from '@/components/ui';
import { WEBSITE_URL } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * Tracker — the legislative feed of the flagship shell.
 *
 * Phase 3 renders bills natively from the tracker API with per-bill
 * scores and an "edit this reform" bridge into Build. Until then this
 * links to the existing proxied tracker.
 */
export default function TrackerPage() {
  const countryId = useCurrentCountry();

  return (
    <Stack style={{ maxWidth: 720, margin: '0 auto', gap: spacing['2xl'] }}>
      <Stack style={{ gap: spacing.md, marginTop: spacing['3xl'] }}>
        <Title order={1}>Legislative tracker</Title>
        <Text style={{ color: colors.text.secondary }}>
          Real bills, each scored with the PolicyEngine model. The tracker is moving into this app;
          bills will soon open directly as editable reforms and reports here.
        </Text>
      </Stack>

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
        <IconGavel size={28} color={colors.primary[600]} />
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          Browse current state legislation and PolicyEngine's cost and distributional estimates for
          each bill.
        </Text>
        <Button asChild>
          <a href={`${WEBSITE_URL}/${countryId}/bill-tracker`} target="_blank" rel="noreferrer">
            Open the bill tracker
            <IconExternalLink size={16} />
          </a>
        </Button>
      </Stack>
    </Stack>
  );
}
