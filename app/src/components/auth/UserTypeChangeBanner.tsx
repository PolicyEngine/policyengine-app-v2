import { useId } from 'react';
import { IconUserCheck, IconX } from '@tabler/icons-react';
import { USER_TYPE_LABELS } from '@/components/admin/adminUserFormat';
import { FLAGSHIP_TOP_BAR_HEIGHT } from '@/components/flagship/FlagshipTopBar';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useDismissTypeChange, useLatestTypeChange } from '@/hooks/useLatestTypeChange';
import { useAccountUpgradeNotice } from '@/libs/auth/accountUpgrade';
import { formatDate } from '@/utils/dateUtils';

const BANNER_TITLE = 'Your account type changed';

/**
 * Tells the signed-in user their type changed (`/v2/me`'s
 * `latest_type_change`) until they dismiss it. Mounted once in the v3
 * workspace, it floats below the top bar in the place and style of the
 * sign-in upgrade's notice, and waits while that notice shows, so the two
 * never cover each other.
 */
export default function UserTypeChangeBanner() {
  const countryId = useCurrentCountry();
  const typeChange = useLatestTypeChange();
  const upgradeNotice = useAccountUpgradeNotice();
  const dismissal = useDismissTypeChange();
  const titleId = useId();
  if (!typeChange || upgradeNotice) {
    return null;
  }
  return (
    <section
      aria-labelledby={titleId}
      aria-live="polite"
      style={{
        position: 'fixed',
        top: `calc(${FLAGSHIP_TOP_BAR_HEIGHT}px + ${spacing.lg})`,
        right: spacing.lg,
        zIndex: 1000,
        width: `min(420px, calc(100vw - 2 * ${spacing.lg}))`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
        background: colors.background.primary,
        boxShadow: '0 8px 24px rgba(20, 32, 31, 0.12)',
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          flexShrink: 0,
          padding: spacing.sm,
          borderRadius: 999,
          background: colors.primary[50],
          color: colors.primary[600],
        }}
      >
        <IconUserCheck size={18} />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, flex: 1 }}>
        <h2
          id={titleId}
          style={{
            margin: 0,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          {BANNER_TITLE}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.relaxed,
            color: colors.text.secondary,
          }}
        >
          It changed from {USER_TYPE_LABELS[typeChange.previous_user_type]} to{' '}
          {USER_TYPE_LABELS[typeChange.user_type]} on{' '}
          {formatDate(typeChange.changed_at, 'short-month-day-year', countryId)}.
        </p>
        {dismissal.isError && (
          <p
            role="alert"
            style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.error }}
          >
            We could not dismiss this: {dismissal.error.message}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => dismissal.mutate(typeChange.id)}
        disabled={dismissal.isPending}
        aria-label="Dismiss"
        style={{ flexShrink: 0, marginTop: -4, marginRight: -4, color: colors.text.tertiary }}
      >
        <IconX size={16} />
      </Button>
    </section>
  );
}
