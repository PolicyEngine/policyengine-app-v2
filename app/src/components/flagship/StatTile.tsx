import { Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface StatTileProps {
  value: string;
  label: string;
  /** Optional second line, e.g. the underlying from → to rates. */
  detail?: string;
}

/** One headline number in a bordered tile — the flagship impact summary unit. */
export default function StatTile({ value, label, detail }: StatTileProps) {
  return (
    <Stack
      style={{
        gap: 2,
        padding: `${spacing.md} ${spacing.lg}`,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
        minWidth: 140,
      }}
    >
      <Text
        style={{
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        {label}
      </Text>
      {detail && (
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {detail}
        </Text>
      )}
    </Stack>
  );
}
