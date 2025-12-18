/**
 * Chart Plugins Module
 *
 * Exports all chart plugin functionality for use in the app.
 */

// Types
export type {
  ChartPluginManifest,
  ChartPluginNavigation,
  ChartPluginOfficialRegistry,
  ChartPluginRegistryEntry,
  ChartPluginStorageState,
  ChartRenderProps,
  InstalledChartPlugin,
  ReportOutput,
} from './types';

// Registry
export { chartPluginRegistry, ChartPluginRegistry } from './ChartPluginRegistry';

// Loader
export { chartPluginLoader, ChartPluginLoader } from './ChartPluginLoader';

// Sandbox
export {
  ChartPluginSandbox,
  destroyChartPluginSandbox,
  getChartPluginSandbox,
  type ChartRenderResult,
} from './ChartPluginSandbox';

// Components
export { createPluginChartComponent, PluginChartWrapper } from './PluginChartWrapper';

// Integration Hooks
export {
  getPluginIdFromViewKey,
  getPluginTreeNodes,
  getPluginViewKey,
  getPluginViewMap,
  injectPluginTreeNodes,
  isPluginViewKey,
  useActiveChartPlugins,
  useChartPluginIntegration,
} from './useChartPluginIntegration';
