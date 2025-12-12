/**
 * usePlugin Hook
 *
 * Hook for checking if a specific plugin is active and getting its info.
 */

import { useMemo } from 'react';
import type { Plugin } from '@/types/plugin';
import { usePluginContext } from '../PluginContext';

export interface UsePluginResult {
  /** Whether the plugin is currently active */
  isActive: boolean;
  /** The plugin object (if registered) */
  plugin: Plugin | undefined;
  /** Install/activate the plugin */
  install: () => Promise<boolean>;
  /** Uninstall/deactivate the plugin */
  uninstall: () => Promise<boolean>;
}

/**
 * Hook to interact with a specific plugin.
 *
 * @param slug The plugin slug to check
 * @returns Plugin state and actions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isActive, install, uninstall } = usePlugin('dark-mode');
 *
 *   return (
 *     <button onClick={isActive ? uninstall : install}>
 *       {isActive ? 'Disable' : 'Enable'} Dark Mode
 *     </button>
 *   );
 * }
 * ```
 */
export function usePlugin(slug: string): UsePluginResult {
  const { availablePlugins, isPluginActive, installPlugin, uninstallPlugin } = usePluginContext();

  const plugin = useMemo(() => {
    return availablePlugins.find((p) => p.slug === slug);
  }, [availablePlugins, slug]);

  const isActive = isPluginActive(slug);

  const install = async () => installPlugin(slug);
  const uninstall = async () => uninstallPlugin(slug);

  return {
    isActive,
    plugin,
    install,
    uninstall,
  };
}

export default usePlugin;
