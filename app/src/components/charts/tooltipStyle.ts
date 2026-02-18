import type { CSSProperties } from 'react';
import { spacing } from '@/designTokens';

/**
 * Shared tooltip container style for all Recharts custom tooltips.
 */
export const TOOLTIP_STYLE: CSSProperties = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  borderRadius: spacing.radius.element,
  padding: '8px 12px',
};
