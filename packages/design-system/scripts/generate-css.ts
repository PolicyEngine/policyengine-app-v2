/**
 * Generate CSS custom properties from design tokens
 * Outputs tokens.css with all --pe-* variables
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { colors } from '../dist/tokens/colors.js';
import { typography } from '../dist/tokens/typography.js';
import { spacing } from '../dist/tokens/spacing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function flattenObject(
  obj: Record<string, unknown>,
  prefix: string,
): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const varName = `${prefix}-${key}`;
    if (typeof value === 'string' || typeof value === 'number') {
      lines.push(`  ${varName}: ${value};`);
    } else if (typeof value === 'object' && value !== null) {
      lines.push(
        ...flattenObject(value as Record<string, unknown>, varName),
      );
    }
  }
  return lines;
}

const sections: string[] = [];

// Colors
sections.push('  /* Colors — primary (teal) */');
sections.push(...flattenObject(colors.primary, '--pe-color-primary'));
sections.push('');
sections.push('  /* Colors — gray */');
sections.push(...flattenObject(colors.gray, '--pe-color-gray'));
sections.push('');
sections.push('  /* Colors — blue */');
sections.push(...flattenObject(colors.blue, '--pe-color-blue'));
sections.push('');
sections.push('  /* Colors — semantic */');
sections.push(`  --pe-color-success: ${colors.success};`);
sections.push(`  --pe-color-warning: ${colors.warning};`);
sections.push(`  --pe-color-error: ${colors.error};`);
sections.push(`  --pe-color-info: ${colors.info};`);
sections.push('');
sections.push('  /* Colors — background */');
sections.push(...flattenObject(colors.background, '--pe-color-bg'));
sections.push('');
sections.push('  /* Colors — text */');
sections.push(...flattenObject(colors.text, '--pe-color-text'));
sections.push('');
sections.push('  /* Colors — border */');
sections.push(...flattenObject(colors.border, '--pe-color-border'));
sections.push('');

// Typography
sections.push('  /* Typography — font families */');
for (const [key, value] of Object.entries(typography.fontFamily)) {
  sections.push(`  --pe-font-family-${key}: ${value};`);
}
sections.push('');
sections.push('  /* Typography — font sizes */');
for (const [key, value] of Object.entries(typography.fontSize)) {
  sections.push(`  --pe-font-size-${key}: ${value};`);
}
sections.push('');
sections.push('  /* Typography — font weights */');
for (const [key, value] of Object.entries(typography.fontWeight)) {
  sections.push(`  --pe-font-weight-${key}: ${value};`);
}
sections.push('');
sections.push('  /* Typography — line heights */');
for (const [key, value] of Object.entries(typography.lineHeight)) {
  sections.push(`  --pe-line-height-${key}: ${value};`);
}
sections.push('');

// Spacing
sections.push('  /* Spacing — base scale */');
const spacingBase = { xs: spacing.xs, sm: spacing.sm, md: spacing.md, lg: spacing.lg, xl: spacing.xl, '2xl': spacing['2xl'], '3xl': spacing['3xl'], '4xl': spacing['4xl'], '5xl': spacing['5xl'] };
for (const [key, value] of Object.entries(spacingBase)) {
  sections.push(`  --pe-space-${key}: ${value};`);
}
sections.push('');
sections.push('  /* Spacing — border radius */');
for (const [key, value] of Object.entries(spacing.radius)) {
  sections.push(`  --pe-radius-${key}: ${value};`);
}

const css = `/**
 * PolicyEngine Design Tokens — CSS Custom Properties
 * Generated from @policyengine/design-system
 * Source of truth: packages/design-system/src/tokens/
 *
 * Usage:
 *   <link rel="stylesheet" href="https://unpkg.com/@policyengine/design-system/dist/tokens.css">
 *   or: @import '@policyengine/design-system/tokens.css';
 *   or: npm install @policyengine/design-system && import '@policyengine/design-system/dist/tokens.css';
 */
:root {
${sections.join('\n')}
}
`;

const outputDir = path.join(__dirname, '..', 'dist');
const outputFile = path.join(outputDir, 'tokens.css');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, css);

console.log(`✅ Generated CSS tokens: ${outputFile}`);
