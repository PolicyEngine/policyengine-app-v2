/**
 * Plugin Data Transformers
 *
 * Processes raw plugins.json data to ensure slugs exist and provide
 * typed access to plugin data.
 */

import type { Plugin } from '@/types/plugin';
import pluginsData from './plugins.json';

// Type assertion for imported JSON
const pluginsRaw = pluginsData as Plugin[];

// Ensure all plugins have slugs (fallback to name-based slug)
const plugins = pluginsRaw.map((plugin) => ({
  ...plugin,
  slug:
    plugin.slug ||
    plugin.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
}));

// Export processed plugins
export { plugins };

export default { plugins };
