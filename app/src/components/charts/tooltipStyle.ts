import type { CSSProperties } from 'react';
import { colors, spacing } from '@/designTokens';

/**
 * Shared tooltip container style for all Recharts custom tooltips.
 */
export const TOOLTIP_STYLE: CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.gray[200]}`,
  borderRadius: spacing.radius.element,
  padding: `${spacing.sm} ${spacing.md}`,
};
