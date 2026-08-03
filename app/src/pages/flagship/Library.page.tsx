import { IconFileDescription, IconPlus, IconScale, IconUsers } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getReformStore } from '@/api/reformStore';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { Reform, ReformSource } from '@/types/ingredients/Reform';

const SOURCE_LABELS: Record<ReformSource, string> = {
  manual: 'Hand-built',
  chat: 'From chat',
  bill: 'From a bill',
  tool: 'From a tool',
};

function ReformCard({ reform }: { reform: Reform }) {
  return (
    <Stack
      style={{
        gap: spacing.xs,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 8,
        background: colors.background.primary,
      }}
    >
      <Stack style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
        <Text style={{ fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
          {reform.label || 'Untitled reform'}
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.primary[700],
            background: colors.primary[50],
            padding: `2px ${spacing.sm}`,
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {SOURCE_LABELS[reform.provenance.source]}
        </Text>
      </Stack>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        {reform.parameters.length === 1
          ? '1 parameter changed'
          : `${reform.parameters.length} parameters changed`}
        {reform.updatedAt &&
          ` · updated ${new Date(reform.updatedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}`}
      </Text>
    </Stack>
  );
}

/**
 * Library — saved work across the flagship shell: reforms first (the
 * canonical object), with quick paths to existing reports and households.
 */
export default function LibraryPage() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  const {
    data: reforms,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['reforms', MOCK_USER_ID, countryId],
    queryFn: () => getReformStore().findByUser(MOCK_USER_ID, countryId),
  });

  return (
    <Stack style={{ maxWidth: 720, margin: '0 auto', gap: spacing['2xl'] }}>
      <Stack
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: spacing['3xl'],
          gap: spacing.md,
        }}
      >
        <Stack style={{ gap: spacing.xs }}>
          <Title order={1}>Your library</Title>
          <Text style={{ color: colors.text.secondary }}>Saved reforms, reports, and inputs.</Text>
        </Stack>
        <Button onClick={() => nav.push(`/${countryId}/build`)}>
          New reform
          <IconPlus size={16} />
        </Button>
      </Stack>

      <Stack style={{ gap: spacing.md }}>
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Reforms
        </Text>

        {isPending && <Spinner />}
        {isError && (
          <Text style={{ color: colors.error, fontSize: typography.fontSize.sm }}>
            Could not load your reforms. Try reloading the page.
          </Text>
        )}
        {reforms && reforms.length === 0 && (
          <Stack
            style={{
              padding: spacing['2xl'],
              border: `1px dashed ${colors.border.light}`,
              borderRadius: 8,
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <IconScale size={24} color={colors.text.secondary} />
            <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
              No saved reforms yet. Build one, or ask a policy question to get started.
            </Text>
          </Stack>
        )}
        {reforms?.map((reform) => (
          <ReformCard key={reform.id} reform={reform} />
        ))}
      </Stack>

      <Stack style={{ gap: spacing.md }}>
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Everything else
        </Text>
        <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => nav.push(`/${countryId}/reports`)}>
            <IconFileDescription size={16} />
            Reports
          </Button>
          <Button variant="outline" onClick={() => nav.push(`/${countryId}/households`)}>
            <IconUsers size={16} />
            Households
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
