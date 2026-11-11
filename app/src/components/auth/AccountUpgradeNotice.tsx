import type { ReactNode } from 'react';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';
import { FLAGSHIP_TOP_BAR_HEIGHT } from '@/components/flagship/FlagshipTopBar';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import {
  dismissAccountUpgradeNotice,
  useAccountUpgradeNotice,
  type AccountUpgradeNotice as Notice,
} from '@/libs/auth/accountUpgrade';

/** The heading, icon and its tint for each outcome, in the v3 panel style. */
const NOTICE_LOOK: Record<
  Notice['kind'],
  { title: string; icon: ReactNode; tint: string; iconColor: string }
> = {
  success: {
    title: 'Added to your account',
    icon: <IconCheck size={18} />,
    tint: colors.primary[50],
    iconColor: colors.primary[600],
  },
  failure: {
    title: 'Not added to your account yet',
    icon: <IconAlertTriangle size={18} />,
    // The warning yellow, tinted, as on a failed report.
    tint: `${colors.warning}33`,
    iconColor: colors.text.warning,
  },
};

/**
 * Reports the upgrade at sign-in (see runAccountUpgrade). Mounted once in
 * the v3 workspace, so it stays up after the callback page has moved on;
 * it floats below the top bar in the workspace's panel style.
 */
export default function AccountUpgradeNotice() {
  const notice = useAccountUpgradeNotice();
  if (!notice) {
    return null;
  }
  const look = NOTICE_LOOK[notice.kind];
  return (
    <section
      role={notice.kind === 'failure' ? 'alert' : 'status'}
      aria-label={look.title}
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
          background: look.tint,
          color: look.iconColor,
        }}
      >
        {look.icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <h2
            style={{
              margin: 0,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            {look.title}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: typography.fontSize.sm,
              lineHeight: typography.lineHeight.relaxed,
              color: colors.text.secondary,
            }}
          >
            {notice.message}
          </p>
        </div>
        {notice.retry && (
          <div>
            <Button size="sm" onClick={notice.retry}>
              Try again
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={dismissAccountUpgradeNotice}
        aria-label="Dismiss"
        style={{ flexShrink: 0, marginTop: -4, marginRight: -4, color: colors.text.tertiary }}
      >
        <IconX size={16} />
      </Button>
    </section>
  );
}
