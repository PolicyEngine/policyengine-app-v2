import {
  IconAdjustments,
  IconArrowRight,
  IconFolder,
  IconGavel,
  IconMessageCircle,
  IconPencil,
} from '@tabler/icons-react';
import { Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useDraftReform } from '@/libs/draftReform';

const CARDS = [
  {
    slug: 'ask',
    label: 'Ask',
    icon: IconMessageCircle,
    description: 'Describe a reform in plain language and see which parameters it touches.',
  },
  {
    slug: 'tracker',
    label: 'Tracker',
    icon: IconGavel,
    description: 'Browse real bills scored with the PolicyEngine model.',
  },
  {
    slug: 'build',
    label: 'Build',
    icon: IconAdjustments,
    description: 'Search every parameter in the model and compose a reform directly.',
  },
  {
    slug: 'library',
    label: 'Library',
    icon: IconFolder,
    description: 'Your saved reforms, ready to edit, duplicate, or extend.',
  },
];

/**
 * Home — the flagship launcher. Four doors in the middle of the screen;
 * navigation lives here rather than in persistent chrome.
 */
export default function FlagshipHomePage() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const draft = useDraftReform();

  const hasDraft = draft && draft.countryId === countryId && draft.provisions.length > 0;

  return (
    <Stack
      style={{
        maxWidth: 840,
        margin: '0 auto',
        gap: spacing['2xl'],
        paddingTop: spacing['3xl'],
        paddingBottom: spacing['2xl'],
      }}
    >
      <Stack style={{ gap: spacing.md }}>
        <Title order={1} style={{ textAlign: 'center' }}>
          What would you like to do?
        </Title>
        <Text style={{ textAlign: 'center', color: colors.text.secondary }}>
          Ask a policy question, follow real legislation, or build a reform from scratch — every
          path ends in an analysis you can save and share.
        </Text>
      </Stack>

      {hasDraft && (
        <button
          type="button"
          onClick={() => nav.push(`/${countryId}/build`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            padding: `${spacing.md} ${spacing.lg}`,
            border: `1px solid ${colors.primary[500]}`,
            borderRadius: 10,
            background: colors.primary[50],
            cursor: 'pointer',
            fontFamily: typography.fontFamily.primary,
            textAlign: 'left',
          }}
        >
          <IconPencil size={18} color={colors.primary[700]} />
          <span style={{ flex: 1, fontSize: typography.fontSize.sm, color: colors.primary[700] }}>
            Resume your draft reform
            {draft.label ? ` — ${draft.label}` : ''} (
            {draft.provisions.length === 1
              ? '1 provision'
              : `${draft.provisions.length} provisions`}
            )
          </span>
          <IconArrowRight size={16} color={colors.primary[700]} />
        </button>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: spacing.lg,
        }}
      >
        {CARDS.map((card) => (
          <button
            key={card.slug}
            type="button"
            onClick={() => nav.push(`/${countryId}/${card.slug}`)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: spacing.md,
              padding: spacing['2xl'],
              border: `1px solid ${colors.border.light}`,
              borderRadius: 14,
              background: colors.background.primary,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: typography.fontFamily.primary,
              transition: 'border-color 0.12s ease, box-shadow 0.12s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = colors.primary[500];
              event.currentTarget.style.boxShadow = '0 4px 16px rgba(20, 32, 31, 0.08)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = colors.border.light;
              event.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 10,
                background: colors.primary[50],
              }}
            >
              <card.icon size={22} color={colors.primary[600]} />
            </span>
            <span
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              {card.label}
            </span>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                lineHeight: 1.5,
              }}
            >
              {card.description}
            </span>
          </button>
        ))}
      </div>
    </Stack>
  );
}
