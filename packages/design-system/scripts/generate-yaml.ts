/**
 * Export design tokens to YAML format
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { colors } from '../dist/tokens/colors.js';
import { typography } from '../dist/tokens/typography.js';
import { spacing } from '../dist/tokens/spacing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, '..', 'dist');
const outputFile = path.join(outputDir, 'tokens.yaml');

const tokens = {
  colors,
  typography,
  spacing,
};

// Create output directory if it doesn't exist
fs.mkdirSync(outputDir, { recursive: true });

// Write the YAML file
fs.writeFileSync(outputFile, yaml.dump(tokens, { indent: 2 }));

console.log(`✅ Generated YAML tokens: ${outputFile}`);
