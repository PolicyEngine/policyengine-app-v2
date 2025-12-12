/**
 * Plugin Slot Component
 *
 * Renders plugin-provided components at designated locations in the app.
 * Each slot is wrapped in an error boundary to prevent plugin errors
 * from crashing the app.
 */

import type { ReactNode } from 'react';
import type { PluginSlotContext } from '@/types/plugin';
import { usePluginContext } from './PluginContext';
import { PluginErrorBoundary } from './PluginErrorBoundary';
import { pluginRegistry } from './PluginRegistry';

export interface PluginSlotProps {
  /** Name of the slot (must match what plugins register) */
  name: string;
  /** Fallback content when no plugins provide content for this slot */
  fallback?: ReactNode;
  /** Context data to pass to plugin components */
  context?: PluginSlotContext;
  /** Wrapper className for the slot container */
  className?: string;
}

/**
 * Renders components from all active plugins that register for this slot.
 *
 * @example
 * ```tsx
 * // In your header component
 * function Header() {
 *   return (
 *     <header>
 *       <Logo />
 *       <Navigation />
 *       <PluginSlot name="header-actions" />
 *       <UserMenu />
 *     </header>
 *   );
 * }
 *
 * // In a plugin
 * const myPlugin: Plugin = {
 *   // ...
 *   slots: {
 *     'header-actions': MyActionButton,
 *   },
 * };
 * ```
 */
export function PluginSlot({ name, fallback, context, className }: PluginSlotProps) {
  const { getSlotComponents } = usePluginContext();
  const components = getSlotComponents(name, context);

  if (components.length === 0) {
    return <>{fallback}</>;
  }

  return (
    <div className={className} data-plugin-slot={name}>
      {components.map(({ pluginSlug, Component, key }) => {
        // Get plugin name for error messages
        const plugin = pluginRegistry.getPlugin(pluginSlug);
        const pluginName = plugin?.name || pluginSlug;

        return (
          <PluginErrorBoundary key={key} pluginSlug={pluginSlug} pluginName={pluginName}>
            <Component context={context} />
          </PluginErrorBoundary>
        );
      })}
    </div>
  );
}

export default PluginSlot;
