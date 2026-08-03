import { IconAdjustments, IconArrowRight, IconSearch } from '@tabler/icons-react';
import { Button, Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * Build — the power-user entry point of the flagship shell.
 *
 * Reuses the existing policy creation pathway; universal parameter
 * search (layer 3) will front this page so parameters are findable
 * without navigating the tree.
 */
export default function BuildPage() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  return (
    <Stack style={{ maxWidth: 720, margin: '0 auto', gap: spacing['2xl'] }}>
      <Stack style={{ gap: spacing.md, marginTop: spacing['3xl'] }}>
        <Title order={1}>Build a reform</Title>
        <Text style={{ color: colors.text.secondary }}>
          Edit any parameter in the model directly — tax rates, benefit amounts, thresholds, and
          phase-outs across every program PolicyEngine covers.
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
        <IconAdjustments size={28} color={colors.primary[600]} />
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
          The parameter editor walks the full policy tree. Your changes become a saved reform you
          can simulate, refine, and share.
        </Text>
        <Button onClick={() => nav.push(`/${countryId}/policies/create`)}>
          Open the parameter editor
          <IconArrowRight size={16} />
        </Button>
      </Stack>

      <Stack
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.lg,
          background: colors.gray[50],
          borderRadius: 8,
          alignItems: 'flex-start',
        }}
      >
        <IconSearch size={18} color={colors.text.secondary} style={{ flexShrink: 0 }} />
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          Coming next: search every parameter by name — no tree navigation required.
        </Text>
      </Stack>
    </Stack>
  );
}
