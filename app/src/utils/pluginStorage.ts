/**
 * Plugin Storage Utilities
 *
 * Manages installed plugins and their settings using sessionStorage.
 * Stores:
 * - Array of plugin slugs that the user has enabled
 * - Settings for each plugin
 */

import type { PluginSettingsValues } from '@/types/plugin';

/** Key used to store installed plugin slugs in sessionStorage */
const INSTALLED_PLUGINS_KEY = 'policyengine-installed-plugins';

/** Key used to store plugin settings in sessionStorage */
const PLUGIN_SETTINGS_KEY = 'policyengine-plugin-settings';

/**
 * Gets the array of installed plugin slugs from sessionStorage
 * @returns Array of plugin slugs, or empty array if none installed
 */
export function getInstalledPlugins(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const stored = sessionStorage.getItem(INSTALLED_PLUGINS_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves the array of installed plugin slugs to sessionStorage
 * @param plugins - Array of plugin slugs to save
 */
function saveInstalledPlugins(plugins: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.setItem(INSTALLED_PLUGINS_KEY, JSON.stringify(plugins));
}

/**
 * Adds a plugin to the installed plugins list
 * @param slug - The plugin slug to add
 * @returns The updated array of installed plugins
 */
export function addInstalledPlugin(slug: string): string[] {
  const plugins = getInstalledPlugins();

  // Don't add if already installed
  if (plugins.includes(slug)) {
    return plugins;
  }

  const updated = [...plugins, slug];
  saveInstalledPlugins(updated);
  return updated;
}

/**
 * Removes a plugin from the installed plugins list
 * @param slug - The plugin slug to remove
 * @returns The updated array of installed plugins
 */
export function removeInstalledPlugin(slug: string): string[] {
  const plugins = getInstalledPlugins();
  const updated = plugins.filter((p) => p !== slug);
  saveInstalledPlugins(updated);
  return updated;
}

/**
 * Checks if a plugin is installed and returns its index
 * @param slug - The plugin slug to check
 * @returns The index of the plugin if installed, or -1 if not installed
 */
export function isPluginInstalled(slug: string): number {
  const plugins = getInstalledPlugins();
  return plugins.indexOf(slug);
}

/**
 * Checks if a plugin is installed (boolean version)
 * @param slug - The plugin slug to check
 * @returns True if the plugin is installed, false otherwise
 */
export function hasPlugin(slug: string): boolean {
  return isPluginInstalled(slug) !== -1;
}

/**
 * Clears all installed plugins from sessionStorage
 */
export function clearInstalledPlugins(): void {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.removeItem(INSTALLED_PLUGINS_KEY);
}

// =============================================================================
// Plugin Settings Storage
// =============================================================================

/** Type for all plugin settings storage */
type AllPluginSettings = Record<string, PluginSettingsValues>;

/**
 * Gets all plugin settings from sessionStorage
 * @returns Object mapping plugin slugs to their settings
 */
function getAllPluginSettings(): AllPluginSettings {
  if (typeof window === 'undefined') {
    return {};
  }

  const stored = sessionStorage.getItem(PLUGIN_SETTINGS_KEY);
  if (!stored) {
    return {};
  }

  try {
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Saves all plugin settings to sessionStorage
 * @param settings - Object mapping plugin slugs to their settings
 */
function saveAllPluginSettings(settings: AllPluginSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.setItem(PLUGIN_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Gets settings for a specific plugin from sessionStorage
 * @param slug - The plugin slug
 * @returns The plugin's settings, or empty object if none saved
 */
export function getPluginSettings(slug: string): PluginSettingsValues {
  const allSettings = getAllPluginSettings();
  return allSettings[slug] || {};
}

/**
 * Saves settings for a specific plugin to sessionStorage
 * @param slug - The plugin slug
 * @param settings - The settings to save
 */
export function setPluginSettings(slug: string, settings: PluginSettingsValues): void {
  const allSettings = getAllPluginSettings();
  allSettings[slug] = settings;
  saveAllPluginSettings(allSettings);
}

/**
 * Removes settings for a specific plugin from sessionStorage
 * @param slug - The plugin slug
 */
export function removePluginSettings(slug: string): void {
  const allSettings = getAllPluginSettings();
  delete allSettings[slug];
  saveAllPluginSettings(allSettings);
}

/**
 * Clears all plugin settings from sessionStorage
 */
export function clearAllPluginSettings(): void {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.removeItem(PLUGIN_SETTINGS_KEY);
}

/**
 * Clears all plugin data (installed plugins and settings)
 */
export function clearAllPluginData(): void {
  clearInstalledPlugins();
  clearAllPluginSettings();
}
