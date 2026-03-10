/**
 * TopBar - Composable top bar with flexible action buttons
 *
 * Renders children (typically ReportMetaPanel segments) on the left and
 * action buttons on the right. All elements share a consistent 44px height.
 */

import React from 'react';
import { Spinner } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES } from '../constants';
import type { TopBarAction } from '../types';

interface TopBarProps {
  children: React.ReactNode;
  actions: TopBarAction[];
}

function getButtonStyles(action: TopBarAction): React.CSSProperties {
  const enabled = !action.disabled && !action.loading;

  if (action.variant === 'primary') {
    return {
      background: enabled ? colors.primary[500] : colors.gray[200],
      color: enabled ? 'white' : colors.gray[500],
      border: 'none',
      boxShadow: 'none',
      cursor: enabled ? 'pointer' : 'not-allowed',
      opacity: action.loading ? 0.7 : 1,
    };
  }

  return {
    background: colors.secondary[100],
    color: colors.secondary[700],
    border: `1px solid ${colors.secondary[200]}`,
    boxShadow: 'none',
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: action.disabled ? 0.5 : 1,
  };
}

function handleMouseEnter(e: React.MouseEvent<HTMLButtonElement>, action: TopBarAction) {
  const enabled = !action.disabled && !action.loading;
  if (!enabled) {
    return;
  }

  if (action.variant === 'primary') {
    e.currentTarget.style.background = colors.primary[600];
  } else {
    e.currentTarget.style.background = colors.secondary[200];
  }
}

function handleMouseLeave(e: React.MouseEvent<HTMLButtonElement>, action: TopBarAction) {
  if (action.variant === 'primary') {
    const enabled = !action.disabled && !action.loading;
    e.currentTarget.style.background = enabled ? colors.primary[500] : colors.gray[200];
  } else {
    e.currentTarget.style.background = colors.secondary[100];
  }
}

export function TopBar({ children, actions }: TopBarProps) {
  return (
    <div
      style={{
        background: colors.white,
        borderRadius: spacing.radius.feature,
        border: `1px solid ${colors.border.light}`,
        boxShadow: `0 4px 24px ${colors.shadow.light}`,
        padding: spacing.sm,
        marginBottom: spacing.xl,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        {children}

        {actions.length > 0 && (
          <div style={{ display: 'flex', gap: spacing.xs, flexShrink: 0 }}>
            {actions.map((action) => (
              <button
                type="button"
                key={action.key}
                style={{
                  ...getButtonStyles(action),
                  height: 38,
                  borderRadius: spacing.radius.feature,
                  padding: `0 ${spacing.md}`,
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: 600,
                  fontSize: FONT_SIZES.small,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
                  handleMouseEnter(e, action)
                }
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
                  handleMouseLeave(e, action)
                }
              >
                {action.loading ? <Spinner size="sm" /> : action.icon}
                <span>{action.loading ? action.loadingLabel || action.label : action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
