/**
 * Chart Plugin Registry
 *
 * Manages registration, installation, and lifecycle of chart plugins.
 * Handles persistence to localStorage and coordinates with the loader.
 */

import type {
  ChartPluginManifest,
  ChartPluginStorageState,
  InstalledChartPlugin,
} from './types';

const STORAGE_KEY = 'policyengine-chart-plugins';

/**
 * Chart Plugin Registry manages all chart plugins and their lifecycle.
 */
export class ChartPluginRegistry {
  /** Installed plugins by ID */
  private installedPlugins = new Map<string, InstalledChartPlugin>();

  /** Set of active plugin IDs */
  private activePluginIds = new Set<string>();

  /** Listeners for state changes */
  private listeners = new Set<() => void>();

  constructor() {
    this.loadFromStorage();
  }

  // ===========================================================================
  // Persistence
  // ===========================================================================

  /** Load state from localStorage */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: ChartPluginStorageState = JSON.parse(stored);

        // Restore installed plugins
        for (const [id, plugin] of Object.entries(state.installedPlugins)) {
          this.installedPlugins.set(id, plugin);
        }

        // Restore active plugins
        for (const id of state.activePluginIds) {
          if (this.installedPlugins.has(id)) {
            this.activePluginIds.add(id);
          }
        }
      }
    } catch (error) {
      console.error('[ChartPluginRegistry] Failed to load from storage:', error);
    }
  }

  /** Save state to localStorage */
  private saveToStorage(): void {
    try {
      const state: ChartPluginStorageState = {
        installedPlugins: Object.fromEntries(this.installedPlugins),
        activePluginIds: Array.from(this.activePluginIds),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[ChartPluginRegistry] Failed to save to storage:', error);
    }
  }

  // ===========================================================================
  // Event Listeners
  // ===========================================================================

  /** Subscribe to state changes */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Notify all listeners of state change */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // ===========================================================================
  // Installation
  // ===========================================================================

  /**
   * Install a chart plugin from a manifest.
   * @param manifest The plugin manifest
   * @param sourceUrl The GitHub repository URL
   * @param code The plugin JavaScript code
   */
  install(manifest: ChartPluginManifest, sourceUrl: string, code: string): void {
    const plugin: InstalledChartPlugin = {
      manifest,
      sourceUrl,
      installedAt: new Date().toISOString(),
      status: 'installed',
      code,
    };

    this.installedPlugins.set(manifest.id, plugin);
    this.activePluginIds.add(manifest.id);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Uninstall a chart plugin.
   */
  uninstall(pluginId: string): void {
    this.installedPlugins.delete(pluginId);
    this.activePluginIds.delete(pluginId);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Check if a plugin is installed.
   */
  isInstalled(pluginId: string): boolean {
    return this.installedPlugins.has(pluginId);
  }

  /**
   * Get an installed plugin by ID.
   */
  getPlugin(pluginId: string): InstalledChartPlugin | undefined {
    return this.installedPlugins.get(pluginId);
  }

  /**
   * Get all installed plugins.
   */
  getAllPlugins(): InstalledChartPlugin[] {
    return Array.from(this.installedPlugins.values());
  }

  // ===========================================================================
  // Activation
  // ===========================================================================

  /**
   * Activate a plugin (enable it for use).
   */
  activate(pluginId: string): boolean {
    if (!this.installedPlugins.has(pluginId)) {
      console.error(`[ChartPluginRegistry] Cannot activate unknown plugin: "${pluginId}"`);
      return false;
    }

    this.activePluginIds.add(pluginId);
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  /**
   * Deactivate a plugin (disable it but keep installed).
   */
  deactivate(pluginId: string): void {
    this.activePluginIds.delete(pluginId);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Check if a plugin is active.
   */
  isActive(pluginId: string): boolean {
    return this.activePluginIds.has(pluginId);
  }

  /**
   * Get all active plugins.
   */
  getActivePlugins(): InstalledChartPlugin[] {
    return Array.from(this.activePluginIds)
      .map((id) => this.installedPlugins.get(id))
      .filter((plugin): plugin is InstalledChartPlugin => plugin !== undefined);
  }

  /**
   * Get active plugins for a specific country.
   */
  getActivePluginsForCountry(countryId: string): InstalledChartPlugin[] {
    return this.getActivePlugins().filter((plugin) =>
      plugin.manifest.countries.includes(countryId as 'us' | 'uk')
    );
  }

  // ===========================================================================
  // Status Management
  // ===========================================================================

  /**
   * Update the status of a plugin.
   */
  updateStatus(
    pluginId: string,
    status: InstalledChartPlugin['status'],
    error?: string
  ): void {
    const plugin = this.installedPlugins.get(pluginId);
    if (plugin) {
      plugin.status = status;
      plugin.error = error;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Update the cached code for a plugin.
   */
  updateCode(pluginId: string, code: string): void {
    const plugin = this.installedPlugins.get(pluginId);
    if (plugin) {
      plugin.code = code;
      // Version will be updated by loader when fetching new manifest
      this.saveToStorage();
    }
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  /**
   * Reset the registry (for testing).
   */
  reset(): void {
    this.installedPlugins.clear();
    this.activePluginIds.clear();
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }
}

/**
 * Global chart plugin registry instance.
 */
export const chartPluginRegistry = new ChartPluginRegistry();
