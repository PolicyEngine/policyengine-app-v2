/**
 * usePluginHook
 *
 * Hooks for executing plugin extension point hooks.
 */

import { useMemo } from 'react';
import type { PluginHookName } from '@/types/plugin';
import { usePluginContext } from '../PluginContext';

/**
 * Execute a pipeline hook and get the transformed result.
 *
 * Pipeline hooks pass a value through each active plugin's hook,
 * allowing each plugin to transform the value.
 *
 * @param hookName The hook to execute
 * @param initialValue The initial value to transform
 * @returns The transformed value
 *
 * @example
 * ```tsx
 * function ThemeProvider({ children }) {
 *   const theme = usePluginPipelineHook('theme:apply', defaultTheme);
 *   return <MantineProvider theme={theme}>{children}</MantineProvider>;
 * }
 * ```
 */
export function usePluginPipelineHook<T>(hookName: PluginHookName, initialValue: T): T {
  const { executeHook, activePlugins } = usePluginContext();

  // Re-run when active plugins change
  return useMemo(() => {
    return executeHook(hookName, initialValue);
  }, [hookName, initialValue, activePlugins, executeHook]);
}

/**
 * Execute a collection hook and get all results.
 *
 * Collection hooks gather results from all active plugins
 * that implement the hook.
 *
 * @param hookName The hook to execute
 * @returns Array of results from all plugins
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const extraItems = usePluginCollectionHook<SidebarItem>('sidebar:items');
 *   return (
 *     <nav>
 *       {defaultItems.map(item => <Item {...item} />)}
 *       {extraItems.map(item => <Item {...item} />)}
 *     </nav>
 *   );
 * }
 * ```
 */
export function usePluginCollectionHook<T>(hookName: PluginHookName): T[] {
  const { collectHook, activePlugins } = usePluginContext();

  // Re-run when active plugins change
  return useMemo(() => {
    return collectHook<T>(hookName);
  }, [hookName, activePlugins, collectHook]);
}

/**
 * Execute a hook and get the first result from any plugin.
 *
 * Useful for hooks where only one plugin should "win",
 * like theme:colorScheme.
 *
 * @param hookName The hook to execute
 * @param defaultValue Value to return if no plugin provides the hook
 * @returns The first result or defaultValue
 *
 * @example
 * ```tsx
 * function App() {
 *   const colorScheme = usePluginFirstHook('theme:colorScheme', 'light');
 *   return <MantineProvider colorScheme={colorScheme}>{children}</MantineProvider>;
 * }
 * ```
 */
export function usePluginFirstHook<T>(hookName: PluginHookName, defaultValue: T): T {
  const { executeHookFirst, activePlugins } = usePluginContext();

  // Re-run when active plugins change
  return useMemo(() => {
    return executeHookFirst(hookName, defaultValue);
  }, [hookName, defaultValue, activePlugins, executeHookFirst]);
}

export default {
  usePluginPipelineHook,
  usePluginCollectionHook,
  usePluginFirstHook,
};
