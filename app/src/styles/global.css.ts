import { globalStyle } from '@vanilla-extract/css';
import { vars } from './theme.css';

globalStyle('.recharts-cartesian-axis-tick-value', {
  fontFamily: vars.font.family.primary,
  fontSize: vars.font.size.xs,
  fill: vars.color.gray[600],
});

globalStyle('.recharts-tooltip-wrapper', {
  outline: 'none',
});

globalStyle('.recharts-default-tooltip', {
  fontFamily: vars.font.family.primary,
  fontSize: vars.font.size.sm,
  borderRadius: vars.radius.md,
  border: `1px solid ${vars.color.border.light}`,
});

globalStyle('.recharts-legend-item-text', {
  fontFamily: vars.font.family.primary,
  fontSize: vars.font.size.sm,
  color: `${vars.color.gray[700]} !important`,
});
