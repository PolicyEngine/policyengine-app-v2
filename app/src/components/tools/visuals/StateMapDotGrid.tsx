/**
 * StateMapDotGrid Component
 *
 * Decorative CSS dot grid representing the US map.
 * 11 columns x 6 rows, 51 visible squares (50 states + DC).
 */

import { Box } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import type { CSSVisualProps } from './registry';

type DotState = 'active' | 'highlight' | 'dim' | 'hidden';

/**
 * Dot pattern for the stylized US map.
 * 11 columns x 6 rows = 66 cells. Exactly 51 are visible (50 states + DC).
 */
const MAP_DOTS: DotState[] = [
  // Row 1 — 7 visible (Pacific NW, northern plains, New England)
  'hidden',
  'dim',
  'active',
  'active',
  'dim',
  'active',
  'dim',
  'hidden',
  'hidden',
  'active',
  'hidden',
  // Row 2 — 11 visible
  'active',
  'active',
  'highlight',
  'active',
  'active',
  'active',
  'dim',
  'active',
  'active',
  'highlight',
  'active',
  // Row 3 — 11 visible (widest span)
  'active',
  'highlight',
  'active',
  'active',
  'active',
  'highlight',
  'active',
  'active',
  'active',
  'active',
  'dim',
  // Row 4 — 9 visible
  'hidden',
  'active',
  'highlight',
  'active',
  'active',
  'active',
  'active',
  'highlight',
  'active',
  'dim',
  'hidden',
  // Row 5 — 7 visible
  'hidden',
  'hidden',
  'active',
  'active',
  'highlight',
  'active',
  'active',
  'dim',
  'active',
  'hidden',
  'hidden',
  // Row 6 — 6 visible (AK far left, southern states, HI far right)
  'dim',
  'hidden',
  'active',
  'active',
  'active',
  'dim',
  'hidden',
  'hidden',
  'hidden',
  'hidden',
  'dim',
];

function getDotStyle(dot: DotState, variant: 'dark' | 'light') {
  if (variant === 'dark') {
    return {
      borderRadius: spacing.radius.xs,
      background:
        dot === 'active'
          ? colors.primary[300]
          : dot === 'highlight'
            ? colors.primary[200]
            : dot === 'dim'
              ? 'rgba(255,255,255,0.06)'
              : 'transparent',
      opacity: dot === 'active' ? 0.7 : dot === 'highlight' ? 0.9 : 1,
      visibility: (dot === 'hidden' ? 'hidden' : 'visible') as 'hidden' | 'visible',
    };
  }
  return {
    borderRadius: spacing.radius.xs,
    background:
      dot === 'active'
        ? colors.primary[400]
        : dot === 'highlight'
          ? colors.primary[300]
          : dot === 'dim'
            ? colors.gray[200]
            : 'transparent',
    opacity: dot === 'active' ? 0.8 : dot === 'highlight' ? 0.9 : 1,
    visibility: (dot === 'hidden' ? 'hidden' : 'visible') as 'hidden' | 'visible',
  };
}

export function StateMapDotGrid({ variant = 'dark', maxWidth = '320px' }: CSSVisualProps) {
  return (
    <Box style={{ position: 'relative', width: '100%', maxWidth }}>
      <Box
        style={{
          width: '100%',
          aspectRatio: '1.6 / 1',
          border:
            variant === 'dark'
              ? '2px solid rgba(255,255,255,0.15)'
              : `2px solid ${colors.gray[300]}`,
          borderRadius: spacing.radius.xl,
          display: 'grid',
          gridTemplateColumns: 'repeat(11, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          gap: '6px',
          padding: spacing.lg,
        }}
      >
        {MAP_DOTS.map((dot, i) => (
          <Box key={i} style={getDotStyle(dot, variant)} />
        ))}
      </Box>
    </Box>
  );
}
