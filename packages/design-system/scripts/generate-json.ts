/**
 * Export design tokens to JSON format
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { colors } from '../dist/tokens/colors.js';
import { typography } from '../dist/tokens/typography.js';
import { spacing } from '../dist/tokens/spacing.js';
import {
  chartColors,
  chartLayout,
  chartDimensions,
  chartLogo,
} from '../dist/charts/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '..', 'dist');
const outputFile = path.join(outputDir, 'tokens.json');

const tokens = {
  colors,
  typography,
  spacing,
  charts: {
    colors: chartColors,
    layout: chartLayout,
    dimensions: chartDimensions,
    logo: chartLogo,
  },
};

// Create output directory if it doesn't exist
fs.mkdirSync(outputDir, { recursive: true });

// Write the JSON file
fs.writeFileSync(outputFile, JSON.stringify(tokens, null, 2));

console.log(`✅ Generated JSON tokens: ${outputFile}`);
