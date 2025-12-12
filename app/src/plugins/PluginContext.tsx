/**
 * Plugin Context
 *
 * React context and provider for the plugin system.
 * Manages plugin state and provides access to plugin functionality
 * throughout the React component tree.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Plugin,
  PluginHookName,
  PluginSettingsValues,
  PluginSlotContext,
} from '@/types/plugin';
import {
  addInstalledPlugin,
  getInstalledPlugins,
  getPluginSettings,
  removeInstalledPlugin,
  setPluginSettings,
} from '@/utils/pluginStorage';
import { pluginRegistry, type SlotComponent } from './PluginRegistry';

// =============================================================================
// Context Types
// =============================================================================

export interface PluginContextValue {
  // State
  /** Array of active plugin slugs */
  activePlugins: string[];
  /** All available (registered) plugins */
  availablePlugins: Plugin[];
  /** Whether the plugin system is initialized */
  isInitialized: boolean;
  /** Version counter that increments when settings change (for dependent components) */
  settingsVersion: number;

  // Actions
  /** Install and activate a plugin */
  installPlugin: (slug: string) => Promise<boolean>;
  /** Deactivate and uninstall a plugin */
  uninstallPlugin: (slug: string) => Promise<boolean>;
  /** Check if a plugin is installed/active */
  isPluginActive: (slug: string) => boolean;

  // Settings
  /** Get settings for a plugin */
  getSettings: (slug: string) => PluginSettingsValues;
  /** Update settings for a plugin */
  updateSettings: (slug: string, settings: PluginSettingsValues) => Promise<boolean>;

  // Hooks
  /** Execute a pipeline hook */
  executeHook: <T>(hookName: PluginHookName, initialValue: T) => T;
  /** Execute a collection hook */
  collectHook: <T>(hookName: PluginHookName) => T[];
  /** Execute a hook and get first result */
  executeHookFirst: <T>(hookName: PluginHookName, defaultValue: T) => T;

  // Slots
  /** Get components registered for a slot */
  getSlotComponents: (slotName: string, context?: PluginSlotContext) => SlotComponent[];
}

// =============================================================================
// Context
// =============================================================================

const PluginContext = createContext<PluginContextValue | null>(null);

// =============================================================================
// Provider Props
// =============================================================================

export interface PluginProviderProps {
  /** React children */
  children: ReactNode;
  /**
   * Plugins to register on mount.
   * These are typically the built-in plugins.
   */
  plugins?: Plugin[];
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Plugin Provider
 *
 * Wraps the application and provides plugin functionality to all children.
 * Handles:
 * - Plugin registration
 * - Restoring installed plugins from storage
 * - Managing active plugin state
 */
export function PluginProvider({ children, plugins = [] }: PluginProviderProps) {
  const [activePlugins, setActivePlugins] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  // Force re-render when settings change
  const [settingsVersion, setSettingsVersion] = useState(0);

  // Register plugins and restore state on mount
  useEffect(() => {
    const initialize = async () => {
      // Register all provided plugins
      for (const plugin of plugins) {
        pluginRegistry.register(plugin);
      }

      // Get previously installed plugins from storage
      const installedSlugs = getInstalledPlugins();

      // Restore settings and activate each installed plugin
      for (const slug of installedSlugs) {
        const plugin = pluginRegistry.getPlugin(slug);
        if (plugin) {
          // Restore settings from storage
          const savedSettings = getPluginSettings(slug);
          if (Object.keys(savedSettings).length > 0) {
            pluginRegistry.setSettingsSilent(slug, savedSettings);
          }

          // Activate the plugin
          await pluginRegistry.activate(slug);
        }
      }

      // Update state with active plugins
      setActivePlugins(pluginRegistry.getActivePluginSlugs());
      setIsInitialized(true);
    };

    initialize();
  }, [plugins]);

  // Get all available plugins
  const availablePlugins = useMemo(() => {
    return pluginRegistry.getAllPlugins();
  }, [isInitialized]);

  // Install a plugin
  const installPlugin = useCallback(async (slug: string): Promise<boolean> => {
    const success = await pluginRegistry.activate(slug);

    if (success) {
      // Persist to storage
      addInstalledPlugin(slug);

      // Save current settings
      const settings = pluginRegistry.getSettings(slug);
      setPluginSettings(slug, settings);

      // Update state
      setActivePlugins(pluginRegistry.getActivePluginSlugs());
    }

    return success;
  }, []);

  // Uninstall a plugin
  const uninstallPlugin = useCallback(async (slug: string): Promise<boolean> => {
    const success = await pluginRegistry.deactivate(slug);

    // Always remove from storage, even if deactivation had issues
    removeInstalledPlugin(slug);

    // Update state
    setActivePlugins(pluginRegistry.getActivePluginSlugs());

    return success;
  }, []);

  // Check if plugin is active
  const isPluginActive = useCallback((slug: string): boolean => {
    return pluginRegistry.isActive(slug);
  }, []);

  // Get settings for a plugin
  const getSettings = useCallback(
    (slug: string): PluginSettingsValues => {
      // settingsVersion dependency ensures we get fresh data after updates
      void settingsVersion;
      return pluginRegistry.getSettings(slug);
    },
    [settingsVersion]
  );

  // Update settings for a plugin
  const updateSettings = useCallback(
    async (slug: string, settings: PluginSettingsValues): Promise<boolean> => {
      const success = await pluginRegistry.updateSettings(slug, settings);

      if (success) {
        // Persist to storage
        setPluginSettings(slug, settings);
        // Trigger re-render
        setSettingsVersion((v) => v + 1);
      }

      return success;
    },
    []
  );

  // Execute a pipeline hook
  const executeHook = useCallback(<T,>(hookName: PluginHookName, initialValue: T): T => {
    return pluginRegistry.executeHook(hookName, initialValue);
  }, []);

  // Execute a collection hook
  const collectHook = useCallback(<T,>(hookName: PluginHookName): T[] => {
    return pluginRegistry.collectHook(hookName);
  }, []);

  // Execute a hook and get first result
  const executeHookFirst = useCallback(<T,>(hookName: PluginHookName, defaultValue: T): T => {
    return pluginRegistry.executeHookFirst(hookName, defaultValue);
  }, []);

  // Get slot components
  const getSlotComponents = useCallback(
    (slotName: string, _context?: PluginSlotContext): SlotComponent[] => {
      return pluginRegistry.getSlotComponents(slotName);
    },
    []
  );

  // Build context value
  const contextValue = useMemo<PluginContextValue>(
    () => ({
      activePlugins,
      availablePlugins,
      isInitialized,
      settingsVersion,
      installPlugin,
      uninstallPlugin,
      isPluginActive,
      getSettings,
      updateSettings,
      executeHook,
      collectHook,
      executeHookFirst,
      getSlotComponents,
    }),
    [
      activePlugins,
      availablePlugins,
      isInitialized,
      settingsVersion,
      installPlugin,
      uninstallPlugin,
      isPluginActive,
      getSettings,
      updateSettings,
      executeHook,
      collectHook,
      executeHookFirst,
      getSlotComponents,
    ]
  );

  return <PluginContext.Provider value={contextValue}>{children}</PluginContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access the plugin context.
 * Must be used within a PluginProvider.
 */
export function usePluginContext(): PluginContextValue {
  const context = useContext(PluginContext);

  if (!context) {
    throw new Error('usePluginContext must be used within a PluginProvider');
  }

  return context;
}

export default PluginContext;
