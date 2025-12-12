/**
 * Plugin System
 *
 * Main entry point for the plugin architecture.
 * Re-exports all public APIs.
 */

// Core
export { PluginRegistry, pluginRegistry } from './PluginRegistry';
export type { SlotComponent } from './PluginRegistry';

// Context & Provider
export { PluginProvider, usePluginContext } from './PluginContext';
export type { PluginContextValue, PluginProviderProps } from './PluginContext';

// Components
export { PluginSlot } from './PluginSlot';
export type { PluginSlotProps } from './PluginSlot';

export { PluginErrorBoundary } from './PluginErrorBoundary';

// Hooks
export {
  usePlugin,
  usePluginPipelineHook,
  usePluginCollectionHook,
  usePluginFirstHook,
  usePluginSettings,
} from './hooks';
export type { UsePluginResult, UsePluginSettingsResult } from './hooks';

// Notifications
export {
  showPluginErrorToast,
  showPluginSuccessToast,
  showPluginInfoToast,
  subscribeToNotifications,
} from './pluginNotifications';
export type { PluginNotification } from './pluginNotifications';

// Re-export types from types/plugin.ts for convenience
export type {
  Plugin,
  PluginMetadata,
  PluginSetting,
  PluginSettingOption,
  PluginSettingsValues,
  PluginHooks,
  PluginHookName,
  PluginSlots,
  PluginSlotContext,
  SidebarExtensionItem,
  HeaderActionItem,
  ExportFormatItem,
  CalculationParams,
  CalculationResults,
  ChartOptions,
  ExportData,
} from '@/types/plugin';
