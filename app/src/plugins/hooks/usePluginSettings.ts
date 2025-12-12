/**
 * usePluginSettings Hook
 *
 * Hook for reading and updating plugin settings.
 */

import { useCallback, useMemo } from 'react';
import type { Plugin, PluginSetting, PluginSettingsValues } from '@/types/plugin';
import { usePluginContext } from '../PluginContext';

export interface UsePluginSettingsResult {
  /** Current settings values */
  settings: PluginSettingsValues;
  /** Settings schema from the plugin */
  schema: PluginSetting[];
  /** Update settings */
  updateSettings: (newSettings: PluginSettingsValues) => Promise<boolean>;
  /** Update a single setting */
  updateSetting: (key: string, value: string | boolean | number) => Promise<boolean>;
  /** Reset settings to defaults */
  resetSettings: () => Promise<boolean>;
}

/**
 * Hook to read and update settings for a specific plugin.
 *
 * @param slug The plugin slug
 * @returns Settings state and update functions
 *
 * @example
 * ```tsx
 * function DarkModeSettings() {
 *   const { settings, schema, updateSetting } = usePluginSettings('dark-mode');
 *
 *   return (
 *     <Select
 *       label="Theme Mode"
 *       value={settings.mode as string}
 *       onChange={(value) => updateSetting('mode', value)}
 *       data={schema.find(s => s.key === 'mode')?.options || []}
 *     />
 *   );
 * }
 * ```
 */
export function usePluginSettings(slug: string): UsePluginSettingsResult {
  const { availablePlugins, getSettings, updateSettings: ctxUpdateSettings } = usePluginContext();

  // Get the plugin to access its settings schema
  const plugin = useMemo<Plugin | undefined>(() => {
    return availablePlugins.find((p) => p.slug === slug);
  }, [availablePlugins, slug]);

  // Get current settings
  const settings = getSettings(slug);

  // Get settings schema
  const schema = useMemo<PluginSetting[]>(() => {
    return plugin?.settings || [];
  }, [plugin]);

  // Get default settings from schema
  const defaultSettings = useMemo<PluginSettingsValues>(() => {
    const defaults: PluginSettingsValues = {};
    for (const setting of schema) {
      defaults[setting.key] = setting.defaultValue;
    }
    return defaults;
  }, [schema]);

  // Update all settings
  const updateSettings = useCallback(
    async (newSettings: PluginSettingsValues): Promise<boolean> => {
      return ctxUpdateSettings(slug, newSettings);
    },
    [slug, ctxUpdateSettings]
  );

  // Update a single setting
  const updateSetting = useCallback(
    async (key: string, value: string | boolean | number): Promise<boolean> => {
      const newSettings = { ...settings, [key]: value };
      return ctxUpdateSettings(slug, newSettings);
    },
    [slug, settings, ctxUpdateSettings]
  );

  // Reset to defaults
  const resetSettings = useCallback(async (): Promise<boolean> => {
    return ctxUpdateSettings(slug, defaultSettings);
  }, [slug, defaultSettings, ctxUpdateSettings]);

  return {
    settings,
    schema,
    updateSettings,
    updateSetting,
    resetSettings,
  };
}

export default usePluginSettings;
