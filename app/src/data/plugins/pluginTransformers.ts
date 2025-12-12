/**
 * Plugin Data Transformers
 *
 * Processes raw plugins.json data and combines with built-in plugin implementations.
 * Built-in plugins have full functionality (hooks, settings, lifecycle).
 * Other plugins from JSON are stub plugins with metadata only.
 */

import type { Plugin, PluginMetadata } from '@/types/plugin';
import { darkModePlugin } from '@/plugins/builtins';
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
 * Map of slug -> built-in plugin implementation
 * Add new built-in plugins here as they are implemented
 */
const builtinPlugins: Record<string, Plugin> = {
  'dark-mode': darkModePlugin,
};

/**
 * Convert plugin metadata to a full Plugin object.
 * If a built-in implementation exists, use it. Otherwise create a stub.
 */
function metadataToPlugin(metadata: PluginMetadata): Plugin {
  // Check if we have a built-in implementation
  const builtin = builtinPlugins[metadata.slug];
  if (builtin) {
    return builtin;
  }

  // Return stub plugin with just metadata
  return {
    ...metadata,
    // No lifecycle methods or hooks - just metadata
  };
}

/**
 * Get all plugins as full Plugin objects.
 * Built-in plugins have full functionality, others are stubs.
 */
const plugins: Plugin[] = pluginMetadata.map(metadataToPlugin);

// Export processed plugins
export { plugins, pluginMetadata };

export default { plugins, pluginMetadata };
