/**
 * Chart Plugin Types
 *
 * Defines the interfaces for the chart plugin system that allows
 * third-party developers to create custom charts for PolicyEngine reports.
 */

import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import type { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

// =============================================================================
// Report Output Types
// =============================================================================

/** Union of all supported report output types */
export type ReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

// =============================================================================
// Chart Plugin Manifest
// =============================================================================

/** Navigation configuration for where the chart appears */
export interface ChartPluginNavigation {
  /** Parent category in the sidebar (e.g., 'distributional-impact') */
  parent: string;
  /** Position within the parent category */
  position?: 'first' | 'last' | number;
}

/** Chart plugin manifest (manifest.json) */
export interface ChartPluginManifest {
  /** Unique identifier for the plugin */
  id: string;
  /** Display name */
  name: string;
  /** Description of what the chart shows */
  description: string;
  /** Semantic version (e.g., '1.0.0') */
  version: string;
  /** Author name or organization */
  author: string;
  /** Countries this chart supports */
  countries: ('us' | 'uk')[];
  /** Navigation configuration */
  navigation: ChartPluginNavigation;
  /** Path to the chart code file (relative to manifest) */
  main: string;
  /** Plugin icon URL (optional) */
  icon?: string;
  /** Repository URL (optional) */
  repository?: string;
}

// =============================================================================
// Chart Plugin Runtime
// =============================================================================

/** Props passed to chart render function */
export interface ChartRenderProps {
  /** The report output data */
  output: ReportOutput;
  /** Country ID ('us' or 'uk') */
  countryId: string;
  /** Container element to render into */
  container: HTMLElement;
  /** Plotly library reference (provided by sandbox) */
  Plotly: {
    newPlot: (
      container: HTMLElement | string,
      data: unknown[],
      layout?: unknown,
      config?: unknown
    ) => Promise<void>;
    react: (
      container: HTMLElement | string,
      data: unknown[],
      layout?: unknown,
      config?: unknown
    ) => Promise<void>;
    d3: {
      format: (fmt: string) => (val: number) => string;
    };
  };
}

/** Chart plugin definition (what the chart.js file exports) */
export interface ChartPluginDefinition {
  /** Render the chart */
  render: (props: ChartRenderProps) => void | Promise<void>;
  /** Clean up resources (optional) */
  cleanup?: () => void;
}

// =============================================================================
// Chart Plugin Registry Types
// =============================================================================

/** Status of a chart plugin */
export type ChartPluginStatus = 'not_installed' | 'installed' | 'loading' | 'error';

/** Installed chart plugin with runtime info */
export interface InstalledChartPlugin {
  /** Plugin manifest */
  manifest: ChartPluginManifest;
  /** GitHub repository URL */
  sourceUrl: string;
  /** When the plugin was installed */
  installedAt: string;
  /** Current status */
  status: ChartPluginStatus;
  /** Error message if status is 'error' */
  error?: string;
  /** The loaded plugin code (cached after first load) */
  code?: string;
}

/** Registry entry in the official chart plugins registry */
export interface ChartPluginRegistryEntry {
  /** Plugin ID */
  id: string;
  /** GitHub repository URL (e.g., 'https://github.com/user/repo') */
  repository: string;
  /** Branch or tag to use (default: 'main') */
  ref?: string;
  /** Path to manifest.json within the repo (default: 'manifest.json') */
  manifestPath?: string;
  /** Whether this is an official/verified plugin */
  verified?: boolean;
}

/** The official registry file structure */
export interface ChartPluginOfficialRegistry {
  /** Registry version */
  version: string;
  /** Last updated timestamp */
  lastUpdated: string;
  /** List of registered plugins */
  plugins: ChartPluginRegistryEntry[];
}

// =============================================================================
// Storage Types
// =============================================================================

/** Storage format for persisted chart plugin state */
export interface ChartPluginStorageState {
  /** Map of plugin ID to installed plugin info */
  installedPlugins: Record<string, InstalledChartPlugin>;
  /** IDs of plugins that should be active */
  activePluginIds: string[];
  /** Last time the registry was checked for updates */
  lastRegistryCheck?: string;
}

// =============================================================================
// Sandbox Communication Types
// =============================================================================

/** Message sent to sandbox iframe */
export interface SandboxRenderMessage {
  type: 'render';
  pluginId: string;
  code: string;
  output: ReportOutput;
  countryId: string;
}

/** Message received from sandbox iframe */
export interface SandboxResultMessage {
  type: 'render_complete' | 'render_error';
  pluginId: string;
  error?: string;
  /** Serialized Plotly chart data */
  plotData?: unknown[];
  plotLayout?: unknown;
  plotConfig?: unknown;
}
