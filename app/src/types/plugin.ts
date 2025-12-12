/**
 * Plugin System Types
 *
 * Defines the interfaces for the plugin architecture including:
 * - Plugin metadata and configuration
 * - Lifecycle methods
 * - Extension point hooks
 * - Settings schema
 * - UI slot definitions
 */

import type { MantineColorScheme, MantineThemeOverride } from '@mantine/core';
import type { ComponentType } from 'react';

// =============================================================================
// Settings Types
// =============================================================================

/** Option for select-type settings */
export interface PluginSettingOption {
  /** Value stored when this option is selected */
  value: string;
  /** Display label for the option */
  label: string;
  /** Optional description shown as helper text */
  description?: string;
}

/** Definition of a single plugin setting */
export interface PluginSetting {
  /** Unique key for this setting */
  key: string;
  /** Display label for the setting */
  label: string;
  /** Optional description/help text */
  description?: string;
  /** Type of input control */
  type: 'select' | 'toggle' | 'text' | 'number';
  /** Options for 'select' type settings */
  options?: PluginSettingOption[];
  /** Default value when plugin is first installed */
  defaultValue: string | boolean | number;
}

/** Runtime settings values */
export type PluginSettingsValues = Record<string, string | boolean | number>;

// =============================================================================
// Hook Types
// =============================================================================

/**
 * Calculation parameters passed to calculation hooks.
 *
 * TODO: This is a placeholder interface. Replace with actual calculation
 * parameter types from your API/calculation system. Example:
 * ```
 * export interface CalculationParams {
 *   policyId: number;
 *   householdId: number;
 *   year: number;
 *   region?: string;
 * }
 * ```
 */
export interface CalculationParams {
  [key: string]: unknown;
}

/**
 * Calculation results passed to calculation hooks.
 *
 * TODO: This is a placeholder interface. Replace with actual calculation
 * result types from your API. Example:
 * ```
 * export interface CalculationResults {
 *   netIncome: number;
 *   marginalTaxRate: number;
 *   benefits: Record<string, number>;
 * }
 * ```
 */
export interface CalculationResults {
  [key: string]: unknown;
}

/**
 * Chart options passed to chart hooks.
 *
 * TODO: This is a placeholder interface. Replace with your charting
 * library's options type (e.g., Plotly's Layout, Chart.js options, etc.).
 */
export interface ChartOptions {
  [key: string]: unknown;
}

/**
 * Export data passed to export hooks.
 *
 * TODO: This is a placeholder interface. Define the structure of data
 * that gets exported (e.g., report data, calculation results, etc.).
 */
export interface ExportData {
  [key: string]: unknown;
}

/**
 * Extension point hooks that plugins can implement.
 * Each hook is called with the plugin's current settings.
 */
export interface PluginHooks {
  // Theme extension
  /** Modify the Mantine theme override object */
  'theme:apply'?: (
    theme: MantineThemeOverride,
    settings: PluginSettingsValues
  ) => MantineThemeOverride;
  /** Return the desired color scheme */
  'theme:colorScheme'?: (settings: PluginSettingsValues) => MantineColorScheme;

  // App lifecycle
  /** Called when the app initializes */
  'app:init'?: (settings: PluginSettingsValues) => void;

  // UI extensions (return arrays of config objects)
  /** Add items to the sidebar */
  'sidebar:items'?: (settings: PluginSettingsValues) => SidebarExtensionItem[];
  /** Add action buttons to the header */
  'header:actions'?: (settings: PluginSettingsValues) => HeaderActionItem[];

  // Calculation extensions
  /** Modify calculation parameters before API call */
  'calculation:beforeRun'?: (
    params: CalculationParams,
    settings: PluginSettingsValues
  ) => CalculationParams;
  /** Post-process calculation results */
  'calculation:afterRun'?: (
    results: CalculationResults,
    settings: PluginSettingsValues
  ) => CalculationResults;

  // Export extensions
  /** Register additional export formats */
  'export:formats'?: (settings: PluginSettingsValues) => ExportFormatItem[];
  /** Transform data before export */
  'export:transform'?: (
    data: ExportData,
    format: string,
    settings: PluginSettingsValues
  ) => ExportData;

  // Chart extensions
  /** Modify chart options */
  'chart:options'?: (options: ChartOptions, settings: PluginSettingsValues) => ChartOptions;
}

/** All valid hook names */
export type PluginHookName = keyof PluginHooks;

// =============================================================================
// Extension Item Types (returned by hooks)
// =============================================================================

/** Item added to sidebar via 'sidebar:items' hook */
export interface SidebarExtensionItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Tabler icon component */
  icon?: ComponentType<{ size?: number; stroke?: number }>;
  /** Navigation path or click handler */
  path?: string;
  onClick?: () => void;
  /** Position hint */
  position?: 'top' | 'bottom';
}

/** Action button added to header via 'header:actions' hook */
export interface HeaderActionItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Tabler icon component */
  icon?: ComponentType<{ size?: number; stroke?: number }>;
  /** Click handler */
  onClick: () => void;
  /** Optional tooltip */
  tooltip?: string;
}

/** Export format registered via 'export:formats' hook */
export interface ExportFormatItem {
  /** Unique format identifier */
  id: string;
  /** Display label */
  label: string;
  /** File extension */
  extension: string;
  /** Tabler icon component */
  icon?: ComponentType<{ size?: number; stroke?: number }>;
  /** Handler to perform the export */
  handler: (data: ExportData) => void | Promise<void>;
}

// =============================================================================
// Slot Types
// =============================================================================

/** Props passed to slot components */
export interface PluginSlotContext {
  /** Arbitrary context data from the slot location */
  [key: string]: unknown;
}

/** Map of slot names to React components */
export type PluginSlots = {
  [slotName: string]: ComponentType<{ context?: PluginSlotContext }>;
};

// =============================================================================
// Main Plugin Interface
// =============================================================================

/**
 * Plugin interface for extensible app functionality.
 *
 * Plugins can:
 * - Define metadata (name, description, image)
 * - Implement lifecycle methods (onActivate, onDeactivate)
 * - Register hooks to extend functionality
 * - Define settings for user configuration
 * - Provide React components for UI slots
 */
export interface Plugin {
  // -------------------------------------------------------------------------
  // Metadata (required)
  // -------------------------------------------------------------------------

  /** Display name of the plugin */
  name: string;

  /** URL-friendly unique identifier */
  slug: string;

  /** Brief description of what the plugin does */
  description: string;

  /** Date plugin was created (ISO format: YYYY-MM-DD) */
  dateCreated: string;

  /** Date plugin was last updated (ISO format: YYYY-MM-DD) */
  dateUpdated: string;

  /** Path to plugin image/icon (relative to public directory) */
  image: string;

  // -------------------------------------------------------------------------
  // Lifecycle Methods (optional)
  // -------------------------------------------------------------------------

  /**
   * Called when the plugin is activated.
   * Use for initialization, DOM manipulation, event listeners, etc.
   * @param settings Current settings values
   */
  onActivate?: (settings: PluginSettingsValues) => void | Promise<void>;

  /**
   * Called when the plugin is deactivated.
   * Use for cleanup, removing event listeners, etc.
   */
  onDeactivate?: () => void | Promise<void>;

  /**
   * Called when plugin settings are changed.
   * @param settings New settings values
   * @param previousSettings Previous settings values
   */
  onSettingsChange?: (
    settings: PluginSettingsValues,
    previousSettings: PluginSettingsValues
  ) => void | Promise<void>;

  // -------------------------------------------------------------------------
  // Extension Points (optional)
  // -------------------------------------------------------------------------

  /** Hooks to extend app functionality */
  hooks?: Partial<PluginHooks>;

  // -------------------------------------------------------------------------
  // Settings (optional)
  // -------------------------------------------------------------------------

  /** Settings schema for user configuration */
  settings?: PluginSetting[];

  // -------------------------------------------------------------------------
  // UI Slots (optional)
  // -------------------------------------------------------------------------

  /**
   * React components to render in named slots.
   * Keys are slot names, values are React components.
   */
  slots?: PluginSlots;
}

// =============================================================================
// Plugin Metadata (JSON-serializable subset)
// =============================================================================

/**
 * JSON-serializable plugin metadata.
 * Used for plugins.json and storage.
 */
export interface PluginMetadata {
  name: string;
  slug: string;
  description: string;
  dateCreated: string;
  dateUpdated: string;
  image: string;
}
