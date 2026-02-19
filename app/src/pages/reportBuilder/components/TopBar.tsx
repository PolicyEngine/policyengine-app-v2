/**
 * TopBar - Composable top bar with flexible action buttons
 *
 * Renders children (typically ReportMetaPanel segments) on the left and
 * action buttons on the right. All elements share a consistent 44px height.
 */

import React from 'react';
import { Box, Loader } from '@mantine/core';
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
      background: enabled
        ? `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`
        : colors.gray[200],
      color: enabled ? 'white' : colors.gray[500],
      border: 'none',
      boxShadow: enabled ? '0 4px 12px rgba(44, 122, 123, 0.3)' : 'none',
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
    e.currentTarget.style.transform = 'scale(1.03)';
    e.currentTarget.style.boxShadow = '0 6px 16px rgba(44, 122, 123, 0.4)';
  } else {
    e.currentTarget.style.background = colors.secondary[200];
  }
}

function handleMouseLeave(e: React.MouseEvent<HTMLButtonElement>, action: TopBarAction) {
  e.currentTarget.style.transform = 'scale(1)';

  if (action.variant === 'primary') {
    const enabled = !action.disabled && !action.loading;
    e.currentTarget.style.boxShadow = enabled ? '0 4px 12px rgba(44, 122, 123, 0.3)' : 'none';
  } else {
    e.currentTarget.style.background = colors.secondary[100];
  }
}

export function TopBar({ children, actions }: TopBarProps) {
  return (
    <Box
      style={{
        background: colors.white,
        borderRadius: spacing.radius.xl,
        border: `1px solid ${colors.border.light}`,
        boxShadow: `0 4px 24px ${colors.shadow.light}`,
        padding: spacing.sm,
        marginBottom: spacing.xl,
      }}
    >
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        {children}

        {actions.length > 0 && (
          <Box style={{ display: 'flex', gap: spacing.xs, flexShrink: 0 }}>
            {actions.map((action) => (
              <Box
                key={action.key}
                component="button"
                style={{
                  ...getButtonStyles(action),
                  height: 44,
                  borderRadius: spacing.radius.lg,
                  padding: `0 ${spacing.lg}`,
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: 600,
                  fontSize: FONT_SIZES.normal,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
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
                {action.loading ? <Loader size={16} color="gray" /> : action.icon}
                <span>{action.loading ? action.loadingLabel || action.label : action.label}</span>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
