/**
 * CSS Visual Registry
 *
 * Maps visual names (used in apps.json `image` field with "css:" prefix)
 * to React components that render decorative CSS visuals.
 */

import type { ComponentType } from 'react';

export interface CSSVisualProps {
  /** 'dark' for teal/gradient backgrounds, 'light' for white/gray backgrounds */
  variant?: 'dark' | 'light';
  /** Optional max width constraint */
  maxWidth?: string;
}

const registry: Record<string, ComponentType<CSSVisualProps>> = {};

/** Register a CSS visual component by name */
export function registerCSSVisual(name: string, component: ComponentType<CSSVisualProps>) {
  registry[name] = component;
}

/** Get a registered CSS visual component by name */
export function getCSSVisual(name: string): ComponentType<CSSVisualProps> | undefined {
  return registry[name];
}

/** Check if an image string references a CSS visual (starts with "css:") */
export function isCSSVisual(image: string | undefined): boolean {
  return typeof image === 'string' && image.startsWith('css:');
}

/** Extract the visual name from a "css:name" string */
export function getCSSVisualName(image: string): string {
  return image.replace(/^css:/, '');
}
