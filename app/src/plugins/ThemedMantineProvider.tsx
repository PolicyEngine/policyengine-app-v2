/**
 * Themed Mantine Provider
 *
 * Wraps MantineProvider and integrates with the plugin system to apply
 * theme modifications from active plugins (e.g., Dark Mode).
 */

import { MantineProvider, type MantineColorScheme, type MantineThemeOverride } from '@mantine/core';
import { useContext, useMemo, type ReactNode } from 'react';
import { cssVariablesResolver } from '@/designTokens';
import PluginContext from './PluginContext';
import { pluginRegistry } from './PluginRegistry';

interface ThemedMantineProviderProps {
  /** Base theme to apply before plugin modifications */
  theme: MantineThemeOverride;
  /** Children to render */
  children: ReactNode;
}

/**
 * Provider that applies plugin theme modifications to Mantine.
 *
 * This component:
 * 1. Executes the 'theme:apply' hook to let plugins modify the theme
 * 2. Executes the 'theme:colorScheme' hook to determine dark/light mode
 * 3. Wraps children in a properly configured MantineProvider
 *
 * Must be used inside a PluginProvider.
 */
export function ThemedMantineProvider({ theme, children }: ThemedMantineProviderProps) {
  const pluginContext = useContext(PluginContext);

  // Apply theme modifications from plugins
  // Re-runs when: theme changes, plugins activate/deactivate, or settings change
  const modifiedTheme = useMemo(() => {
    if (!pluginContext) {
      return theme;
    }

    // Execute 'theme:apply' hook - pipeline pattern
    return pluginRegistry.executeHook('theme:apply', theme);
  }, [theme, pluginContext?.activePlugins, pluginContext?.settingsVersion]);

  // Get color scheme from plugins
  // forceColorScheme only accepts 'light' | 'dark' | undefined, not 'auto'
  // Re-runs when: plugins activate/deactivate or settings change
  const colorScheme = useMemo((): 'light' | 'dark' | undefined => {
    if (!pluginContext) {
      return undefined; // Use Mantine's default behavior
    }

    // Execute 'theme:colorScheme' hook - first result wins
    const result = pluginRegistry.executeHookFirst(
      'theme:colorScheme',
      'auto' as MantineColorScheme
    );

    // If 'auto' or no result, let Mantine handle it (return undefined)
    if (result === 'auto') {
      return undefined;
    }

    return result as 'light' | 'dark';
  }, [pluginContext?.activePlugins, pluginContext?.settingsVersion]);

  return (
    <MantineProvider
      theme={modifiedTheme}
      forceColorScheme={colorScheme}
      cssVariablesResolver={cssVariablesResolver}
    >
      {children}
    </MantineProvider>
  );
}

export default ThemedMantineProvider;
