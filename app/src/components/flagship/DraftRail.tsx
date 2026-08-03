import { IconScale } from '@tabler/icons-react';
import { Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useDraftReform } from '@/libs/draftReform';
import ReformPreviewCard from './ReformPreviewCard';

/**
 * The always-visible draft panel of the workspace layout. Empty state
 * explains how work accumulates here; with a draft it renders the
 * preview card.
 */
export default function DraftRail() {
  const draft = useDraftReform();
  const countryId = useCurrentCountry();

  if (draft && draft.countryId === countryId && draft.provisions.length > 0) {
    return <ReformPreviewCard draft={draft} />;
  }

  return (
    <Stack
      style={{
        gap: spacing.sm,
        padding: spacing['2xl'],
        border: `1px dashed ${colors.border.light}`,
        borderRadius: 12,
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <IconScale size={22} color={colors.text.secondary} />
      <Text
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
        }}
      >
        Your draft reform
      </Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        Parameters you pick collect here — edit the values, name it, and save it to your library.
      </Text>
    </Stack>
  );
}
