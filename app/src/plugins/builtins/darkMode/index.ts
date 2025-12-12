/**
 * Dark Mode Plugin
 *
 * Adds dark mode support to the PolicyEngine app with three modes:
 * - Always Dark: Forces dark theme regardless of system preference
 * - Always Light: Keeps light theme (effectively disables plugin)
 * - System: Follows operating system dark mode preference
 */

import type { MantineColorScheme, MantineThemeOverride } from '@mantine/core';
import type { Plugin, PluginSettingsValues } from '@/types/plugin';
import { getDarkThemeOverrides } from './darkTheme';

/** Media query for system dark mode preference */
let mediaQuery: MediaQueryList | null = null;

/** Callback for system preference changes */
let systemChangeHandler: ((e: MediaQueryListEvent) => void) | null = null;

/** Current settings reference (for system change handler) */
let currentSettings: PluginSettingsValues = {};

/**
 * Determines if dark mode should be active based on settings
 */
function shouldUseDarkMode(settings: PluginSettingsValues): boolean {
  const mode = settings.mode as string;

  if (mode === 'dark') {
    return true;
  }

  if (mode === 'light') {
    return false;
  }

  // System mode: check OS preference
  if (mode === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return false;
}

/**
 * Updates the document's data-theme attribute for CSS-based styling
 */
function updateDocumentTheme(isDark: boolean): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}

/**
 * Handle system preference change events
 */
function handleSystemChange(event: MediaQueryListEvent): void {
  if (currentSettings.mode === 'system') {
    updateDocumentTheme(event.matches);
  }
}

/**
 * Dark Mode Plugin Definition
 */
export const darkModePlugin: Plugin = {
  // Metadata (matches plugins.json)
  name: 'Dark Mode',
  slug: 'dark-mode',
  description:
    "Switch to a dark color scheme that's easier on the eyes in low-light environments. Reduces eye strain and saves battery on OLED displays.",
  dateCreated: '2025-01-15',
  dateUpdated: '2025-03-10',
  image: '/assets/plugins/dark-mode.svg',

  // Settings schema
  settings: [
    {
      key: 'mode',
      label: 'Theme Mode',
      description: 'Choose when to apply dark mode',
      type: 'select',
      defaultValue: 'system',
      options: [
        {
          value: 'dark',
          label: 'Always Dark',
          description: 'Always use dark theme',
        },
        {
          value: 'light',
          label: 'Always Light',
          description: 'Always use light theme (disables dark mode)',
        },
        {
          value: 'system',
          label: 'System',
          description: 'Follow your operating system preference',
        },
      ],
    },
  ],

  // Lifecycle methods
  onActivate(settings: PluginSettingsValues): void {
    currentSettings = settings;

    // Apply initial theme
    const isDark = shouldUseDarkMode(settings);
    updateDocumentTheme(isDark);

    // Set up system preference listener for 'system' mode
    if (settings.mode === 'system' && typeof window !== 'undefined') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      systemChangeHandler = handleSystemChange;
      mediaQuery.addEventListener('change', systemChangeHandler);
    }
  },

  onDeactivate(): void {
    // Clean up system preference listener
    if (mediaQuery && systemChangeHandler) {
      mediaQuery.removeEventListener('change', systemChangeHandler);
      mediaQuery = null;
      systemChangeHandler = null;
    }

    // Reset document theme attribute
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme');
    }

    currentSettings = {};
  },

  onSettingsChange(settings: PluginSettingsValues, previousSettings: PluginSettingsValues): void {
    currentSettings = settings;

    // Handle mode changes
    const newMode = settings.mode as string;
    const oldMode = previousSettings.mode as string;

    // Update document theme
    const isDark = shouldUseDarkMode(settings);
    updateDocumentTheme(isDark);

    // Manage system preference listener
    if (newMode === 'system' && oldMode !== 'system') {
      // Switched TO system mode: add listener
      if (typeof window !== 'undefined') {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        systemChangeHandler = handleSystemChange;
        mediaQuery.addEventListener('change', systemChangeHandler);
      }
    } else if (newMode !== 'system' && oldMode === 'system') {
      // Switched FROM system mode: remove listener
      if (mediaQuery && systemChangeHandler) {
        mediaQuery.removeEventListener('change', systemChangeHandler);
        mediaQuery = null;
        systemChangeHandler = null;
      }
    }
  },

  // Extension hooks
  hooks: {
    /**
     * Apply dark theme overrides to the Mantine theme
     */
    'theme:apply': (
      theme: MantineThemeOverride,
      settings: PluginSettingsValues
    ): MantineThemeOverride => {
      if (!shouldUseDarkMode(settings)) {
        return theme;
      }

      const darkOverrides = getDarkThemeOverrides();

      return {
        ...theme,
        colors: {
          ...theme.colors,
          ...darkOverrides.colors,
        },
        other: {
          ...theme.other,
          ...darkOverrides.other,
        },
      };
    },

    /**
     * Return the color scheme based on settings
     */
    'theme:colorScheme': (settings: PluginSettingsValues): MantineColorScheme => {
      const mode = settings.mode as string;

      if (mode === 'dark') {
        return 'dark';
      }

      if (mode === 'light') {
        return 'light';
      }

      // System mode
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      return 'light';
    },
  },
};

export default darkModePlugin;
