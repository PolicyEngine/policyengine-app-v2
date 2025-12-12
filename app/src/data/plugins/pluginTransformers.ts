/**
 * Plugin Data Transformers
 *
 * Processes raw plugins.json data to ensure slugs exist and provide
 * typed access to plugin data.
 */

import type { Plugin, PluginMetadata } from '@/types/plugin';
import pluginsData from './plugins.json';

// Type assertion for imported JSON (metadata only)
const pluginMetadataRaw = pluginsData as PluginMetadata[];

// Ensure all plugins have slugs (fallback to name-based slug)
const pluginMetadata: PluginMetadata[] = pluginMetadataRaw.map((plugin) => ({
  ...plugin,
  slug:
    plugin.slug ||
    plugin.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
}));

/**
 * Convert plugin metadata to a full Plugin object.
 * This creates a "stub" plugin that has no actual functionality.
 * Real implementations should be provided in the builtins directory.
 */
function metadataToPlugin(metadata: PluginMetadata): Plugin {
  return {
    ...metadata,
    // No lifecycle methods or hooks - just metadata
  };
}

/**
 * Get all plugins as full Plugin objects.
 * For now, these are stub plugins from the JSON metadata.
 * As plugins are implemented, they should be imported from builtins.
 */
const plugins: Plugin[] = pluginMetadata.map(metadataToPlugin);

// Export processed plugins
export { plugins, pluginMetadata };

export default { plugins, pluginMetadata };
