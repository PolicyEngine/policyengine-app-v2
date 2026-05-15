import type { CSSProperties } from 'react';
import { colors, spacing } from '@/designTokens';

/**
 * Shared tooltip container style for all Recharts custom tooltips.
 */
export const TOOLTIP_STYLE: CSSProperties = {
  background: colors.background.elevated,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.element,
  padding: `${spacing.sm} ${spacing.md}`,
};
