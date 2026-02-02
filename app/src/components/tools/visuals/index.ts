// Register visuals
import { registerCSSVisual } from './registry';
import { StateMapDotGrid } from './StateMapDotGrid';

/**
 * CSS Visuals — Barrel Export
 *
 * Imports all visual components and registers them.
 * Import this module to ensure registration before rendering.
 */

export { registerCSSVisual, getCSSVisual, isCSSVisual, getCSSVisualName } from './registry';
export type { CSSVisualProps } from './registry';

registerCSSVisual('state-map-dots', StateMapDotGrid);

// Re-export individual visuals for direct use
export { StateMapDotGrid } from './StateMapDotGrid';
export { AppVisual } from './AppVisual';
