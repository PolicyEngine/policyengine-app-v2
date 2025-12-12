/**
 * Plugin Registry
 *
 * Core class that manages plugin registration, activation, and hook execution.
 * Implements error handling to ensure plugin failures don't crash the app.
 */

import type { ComponentType } from 'react';
import type {
  Plugin,
  PluginHookName,
  PluginSettingsValues,
  PluginSlotContext,
} from '@/types/plugin';
import { showPluginErrorToast } from './pluginNotifications';

/** Represents a component registered for a slot */
export interface SlotComponent {
  pluginSlug: string;
  Component: ComponentType<{ context?: PluginSlotContext }>;
  key: string;
}

/**
 * Plugin Registry manages all registered plugins and their lifecycle.
 */
export class PluginRegistry {
  /** All registered plugins */
  private plugins = new Map<string, Plugin>();

  /** Set of currently active plugin slugs */
  private activePlugins = new Set<string>();

  /** Settings for each plugin */
  private pluginSettings = new Map<string, PluginSettingsValues>();

  // ===========================================================================
  // Registration
  // ===========================================================================

  /**
   * Register a plugin with the registry.
   * Does not activate the plugin.
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.slug)) {
      console.warn(`[PluginRegistry] Plugin "${plugin.slug}" is already registered. Skipping.`);
      return;
    }

    this.plugins.set(plugin.slug, plugin);

    // Initialize settings with defaults
    const defaultSettings = this.getDefaultSettings(plugin);
    this.pluginSettings.set(plugin.slug, defaultSettings);
  }

  /**
   * Unregister a plugin. Deactivates it first if active.
   */
  async unregister(slug: string): Promise<void> {
    if (this.isActive(slug)) {
      await this.deactivate(slug);
    }
    this.plugins.delete(slug);
    this.pluginSettings.delete(slug);
  }

  /**
   * Get a registered plugin by slug.
   */
  getPlugin(slug: string): Plugin | undefined {
    return this.plugins.get(slug);
  }

  /**
   * Get all registered plugins.
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  // ===========================================================================
  // Activation / Deactivation
  // ===========================================================================

  /**
   * Activate a plugin.
   * Calls the plugin's onActivate lifecycle method.
   */
  async activate(slug: string, settings?: PluginSettingsValues): Promise<boolean> {
    const plugin = this.plugins.get(slug);

    if (!plugin) {
      console.error(`[PluginRegistry] Cannot activate unknown plugin: "${slug}"`);
      return false;
    }

    if (this.activePlugins.has(slug)) {
      console.warn(`[PluginRegistry] Plugin "${slug}" is already active.`);
      return true;
    }

    // Update settings if provided
    if (settings) {
      this.pluginSettings.set(slug, settings);
    }

    const currentSettings = this.getSettings(slug);

    try {
      if (plugin.onActivate) {
        await plugin.onActivate(currentSettings);
      }
      this.activePlugins.add(slug);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PluginRegistry] Failed to activate plugin "${slug}":`, error);
      showPluginErrorToast(plugin.name, `Failed to activate: ${message}`);
      return false;
    }
  }

  /**
   * Deactivate a plugin.
   * Calls the plugin's onDeactivate lifecycle method.
   */
  async deactivate(slug: string): Promise<boolean> {
    const plugin = this.plugins.get(slug);

    if (!plugin) {
      console.error(`[PluginRegistry] Cannot deactivate unknown plugin: "${slug}"`);
      return false;
    }

    if (!this.activePlugins.has(slug)) {
      console.warn(`[PluginRegistry] Plugin "${slug}" is not active.`);
      return true;
    }

    try {
      if (plugin.onDeactivate) {
        await plugin.onDeactivate();
      }
      this.activePlugins.delete(slug);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PluginRegistry] Failed to deactivate plugin "${slug}":`, error);
      showPluginErrorToast(plugin.name, `Failed to deactivate: ${message}`);
      // Still mark as inactive even if cleanup failed
      this.activePlugins.delete(slug);
      return false;
    }
  }

  /**
   * Check if a plugin is currently active.
   */
  isActive(slug: string): boolean {
    return this.activePlugins.has(slug);
  }

  /**
   * Get all active plugin slugs.
   */
  getActivePluginSlugs(): string[] {
    return Array.from(this.activePlugins);
  }

  /**
   * Get all active plugins.
   */
  getActivePlugins(): Plugin[] {
    return this.getActivePluginSlugs()
      .map((slug) => this.plugins.get(slug))
      .filter((plugin): plugin is Plugin => plugin !== undefined);
  }

  // ===========================================================================
  // Settings
  // ===========================================================================

  /**
   * Get default settings values for a plugin.
   */
  private getDefaultSettings(plugin: Plugin): PluginSettingsValues {
    const defaults: PluginSettingsValues = {};

    if (plugin.settings) {
      for (const setting of plugin.settings) {
        defaults[setting.key] = setting.defaultValue;
      }
    }

    return defaults;
  }

  /**
   * Get current settings for a plugin.
   */
  getSettings(slug: string): PluginSettingsValues {
    return this.pluginSettings.get(slug) || {};
  }

  /**
   * Update settings for a plugin.
   * Calls onSettingsChange if the plugin is active.
   */
  async updateSettings(slug: string, newSettings: PluginSettingsValues): Promise<boolean> {
    const plugin = this.plugins.get(slug);

    if (!plugin) {
      console.error(`[PluginRegistry] Cannot update settings for unknown plugin: "${slug}"`);
      return false;
    }

    const previousSettings = this.getSettings(slug);
    this.pluginSettings.set(slug, newSettings);

    // Notify the plugin if it's active
    if (this.isActive(slug) && plugin.onSettingsChange) {
      try {
        await plugin.onSettingsChange(newSettings, previousSettings);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[PluginRegistry] Error in onSettingsChange for "${slug}":`, error);
        showPluginErrorToast(plugin.name, `Settings change failed: ${message}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Set settings directly without triggering onSettingsChange.
   * Used when restoring settings from storage.
   */
  setSettingsSilent(slug: string, settings: PluginSettingsValues): void {
    this.pluginSettings.set(slug, settings);
  }

  // ===========================================================================
  // Hook Execution
  // ===========================================================================

  /**
   * Execute a hook across all active plugins (pipeline pattern).
   * Each plugin's hook receives the result of the previous plugin.
   *
   * @param hookName The hook to execute
   * @param initialValue The initial value passed to the first plugin
   * @param extraArgs Additional arguments to pass to each hook
   * @returns The final transformed value
   */
  executeHook<T>(hookName: PluginHookName, initialValue: T, ...extraArgs: unknown[]): T {
    let result = initialValue;

    for (const slug of this.activePlugins) {
      const plugin = this.plugins.get(slug);
      const hook = plugin?.hooks?.[hookName] as
        | ((value: T, settings: PluginSettingsValues, ...args: unknown[]) => T)
        | undefined;

      if (hook) {
        try {
          const settings = this.getSettings(slug);
          result = hook(result, settings, ...extraArgs);
        } catch (error) {
          console.error(
            `[PluginRegistry] Error in hook "${hookName}" for plugin "${slug}":`,
            error
          );
          // Continue with other plugins, don't break the chain
        }
      }
    }

    return result;
  }

  /**
   * Execute a hook across all active plugins and collect results (aggregation pattern).
   * Used for hooks that return arrays (e.g., sidebar:items, export:formats).
   *
   * @param hookName The hook to execute
   * @returns Array of all results from all plugins
   */
  collectHook<T>(hookName: PluginHookName): T[] {
    const results: T[] = [];

    for (const slug of this.activePlugins) {
      const plugin = this.plugins.get(slug);
      const hook = plugin?.hooks?.[hookName] as
        | ((settings: PluginSettingsValues) => T[])
        | undefined;

      if (hook) {
        try {
          const settings = this.getSettings(slug);
          const hookResult = hook(settings);
          if (Array.isArray(hookResult)) {
            results.push(...hookResult);
          }
        } catch (error) {
          console.error(
            `[PluginRegistry] Error in hook "${hookName}" for plugin "${slug}":`,
            error
          );
          // Continue with other plugins
        }
      }
    }

    return results;
  }

  /**
   * Execute a hook that returns a single value from the first plugin that provides it.
   * Used for hooks like theme:colorScheme where we want one answer.
   *
   * @param hookName The hook to execute
   * @param defaultValue Value to return if no plugin provides the hook
   * @returns The value from the first plugin with this hook, or defaultValue
   */
  executeHookFirst<T>(hookName: PluginHookName, defaultValue: T): T {
    for (const slug of this.activePlugins) {
      const plugin = this.plugins.get(slug);
      const hook = plugin?.hooks?.[hookName] as ((settings: PluginSettingsValues) => T) | undefined;

      if (hook) {
        try {
          const settings = this.getSettings(slug);
          return hook(settings);
        } catch (error) {
          console.error(
            `[PluginRegistry] Error in hook "${hookName}" for plugin "${slug}":`,
            error
          );
          // Try next plugin
        }
      }
    }

    return defaultValue;
  }

  // ===========================================================================
  // Slots
  // ===========================================================================

  /**
   * Get all components registered for a slot by active plugins.
   *
   * @param slotName The name of the slot
   * @returns Array of slot components from active plugins
   */
  getSlotComponents(slotName: string): SlotComponent[] {
    const components: SlotComponent[] = [];

    for (const slug of this.activePlugins) {
      const plugin = this.plugins.get(slug);
      const SlotComponent = plugin?.slots?.[slotName];

      if (SlotComponent) {
        components.push({
          pluginSlug: slug,
          Component: SlotComponent,
          key: `${slug}-${slotName}`,
        });
      }
    }

    return components;
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  /**
   * Reset the registry (for testing).
   */
  reset(): void {
    this.plugins.clear();
    this.activePlugins.clear();
    this.pluginSettings.clear();
  }
}

/**
 * Global plugin registry instance.
 * Use this for app-wide plugin management.
 */
export const pluginRegistry = new PluginRegistry();
