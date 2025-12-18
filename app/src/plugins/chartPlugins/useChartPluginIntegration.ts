/**
 * Chart Plugin Integration Hook
 *
 * Provides utilities for integrating chart plugins with the
 * ComparativeAnalysisPage VIEW_MAP and navigation tree.
 */

import { useCallback, useMemo, useSyncExternalStore, type ComponentType } from 'react';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { TreeNode } from '@/pages/report-output/comparativeAnalysisTree';
import { chartPluginRegistry } from './ChartPluginRegistry';
import { createPluginChartComponent } from './PluginChartWrapper';
import type { InstalledChartPlugin } from './types';

// Cache for stable references to prevent infinite re-renders
let cachedPlugins: InstalledChartPlugin[] = [];
let cachedPluginsKey = '';

/**
 * View component props interface (must match ComparativeAnalysisPage)
 */
interface ViewComponentProps {
  output: SocietyWideReportOutput;
}

/**
 * Get the view key for a plugin (used in URL and VIEW_MAP)
 */
export function getPluginViewKey(pluginId: string): string {
  return `plugin-${pluginId}`;
}

/**
 * Check if a view key is a plugin view
 */
export function isPluginViewKey(viewKey: string): boolean {
  return viewKey.startsWith('plugin-');
}

/**
 * Extract plugin ID from a view key
 */
export function getPluginIdFromViewKey(viewKey: string): string | null {
  if (!isPluginViewKey(viewKey)) {
    return null;
  }
  return viewKey.replace('plugin-', '');
}

/**
 * Get VIEW_MAP entries for all active chart plugins for a country.
 */
export function getPluginViewMap(
  countryId: string
): Record<string, ComponentType<ViewComponentProps>> {
  const viewMap: Record<string, ComponentType<ViewComponentProps>> = {};

  const plugins = chartPluginRegistry.getActivePluginsForCountry(countryId);

  for (const plugin of plugins) {
    const viewKey = getPluginViewKey(plugin.manifest.id);
    viewMap[viewKey] = createPluginChartComponent(plugin.manifest.id);
  }

  return viewMap;
}

/**
 * Create a tree node for a plugin chart.
 */
function createPluginTreeNode(plugin: InstalledChartPlugin): TreeNode {
  return {
    name: getPluginViewKey(plugin.manifest.id),
    label: plugin.manifest.name,
  };
}

/**
 * Get navigation tree nodes for all active chart plugins for a country.
 * Groups plugins under a "Plugins" category.
 */
export function getPluginTreeNodes(countryId: string): TreeNode | null {
  const plugins = chartPluginRegistry.getActivePluginsForCountry(countryId);

  if (plugins.length === 0) {
    return null;
  }

  return {
    name: 'chart-plugins',
    label: 'Chart Plugins',
    children: plugins.map(createPluginTreeNode),
  };
}

/**
 * Inject plugin tree nodes into an existing tree.
 * Adds the plugins section at the end of the tree.
 */
export function injectPluginTreeNodes(
  tree: TreeNode[],
  countryId: string
): TreeNode[] {
  const pluginNode = getPluginTreeNodes(countryId);

  if (!pluginNode) {
    return tree;
  }

  return [...tree, pluginNode];
}

/**
 * Get a stable reference to active plugins for a country.
 * Only creates a new array if the plugins have actually changed.
 */
function getStablePlugins(countryId: string): InstalledChartPlugin[] {
  const plugins = chartPluginRegistry.getActivePluginsForCountry(countryId);
  const key = `${plugins.map((p) => p.manifest.id).join(',')}:${countryId}`;

  if (key !== cachedPluginsKey) {
    cachedPlugins = plugins;
    cachedPluginsKey = key;
  }

  return cachedPlugins;
}

/**
 * Hook to get active chart plugins for the current country.
 * Subscribes to registry changes for automatic updates.
 */
export function useActiveChartPlugins(countryId: string): InstalledChartPlugin[] {
  // Subscribe to registry changes
  const subscribe = useCallback((callback: () => void) => {
    return chartPluginRegistry.subscribe(callback);
  }, []);

  // Get snapshot of active plugins with stable reference
  const getSnapshot = useCallback(() => {
    return getStablePlugins(countryId);
  }, [countryId]);

  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Hook that provides VIEW_MAP and tree integration for chart plugins.
 * Use this in components that need to render or navigate to plugin charts.
 */
export function useChartPluginIntegration(countryId: string) {
  const activePlugins = useActiveChartPlugins(countryId);

  // Memoize derived values to prevent infinite re-renders
  const viewMap = useMemo(
    () => getPluginViewMap(countryId),
    [countryId, activePlugins]
  );

  const treeNode = useMemo(
    () => getPluginTreeNodes(countryId),
    [countryId, activePlugins]
  );

  const injectIntoTree = useCallback(
    (tree: TreeNode[]) => injectPluginTreeNodes(tree, countryId),
    [countryId]
  );

  return {
    /** Active plugins for this country */
    plugins: activePlugins,
    /** Number of active plugins */
    count: activePlugins.length,
    /** VIEW_MAP entries for plugins */
    viewMap,
    /** Navigation tree node for plugins */
    treeNode,
    /** Helper to inject into existing tree */
    injectIntoTree,
  };
}
