/**
 * AskChatCta — attention-grabbing banner that routes users to the standalone
 * chat surface (alternative positioning of policyengine-uk-chat).
 *
 * Designed to sit above the IngredientReadView on the Reports page. The visual
 * treatment (tinted background, sparkle icon, "New" badge) is meant to draw
 * attention without competing with the primary "Create report" button — they
 * occupy different rows and tell different stories.
 */
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface AskChatCtaProps {
  onClick: () => void;
}

export function AskChatCta({ onClick }: AskChatCtaProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="tw:group tw:w-full tw:text-left tw:cursor-pointer tw:transition-all tw:hover:shadow-md"
      style={{
        backgroundColor: colors.primary[50],
        border: `1px solid ${colors.primary[200]}`,
        borderRadius: spacing.radius.container,
        padding: `${spacing.lg} ${spacing.xl}`,
        marginBottom: spacing.lg,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.lg,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: colors.primary[500],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconSparkles size={20} color={colors.white} />
      </div>

      <div className="tw:flex-1 tw:min-w-0">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: '2px',
          }}
        >
          <Text
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.title,
            }}
          >
            Or just ask
          </Text>
          <span
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: colors.primary[700],
              backgroundColor: colors.primary[100],
              padding: '2px 8px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            New
          </span>
        </div>
        <Text size="sm" style={{ color: colors.text.secondary }}>
          Skip the builder and ask a policy question in plain English. The assistant runs the
          simulation for you.
        </Text>
      </div>

      <IconArrowRight
        size={20}
        color={colors.primary[600]}
        className="tw:transition-transform tw:group-hover:translate-x-1"
      />
    </button>
  );
}
