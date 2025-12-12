/**
 * Plugin Error Boundary
 *
 * React Error Boundary that catches errors from plugin-rendered components.
 * Prevents plugin errors from crashing the entire app.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { showPluginErrorToast } from './pluginNotifications';

interface PluginErrorBoundaryProps {
  /** Slug of the plugin (for error reporting) */
  pluginSlug: string;
  /** Display name of the plugin (for user-friendly messages) */
  pluginName?: string;
  /** Content to render */
  children: ReactNode;
  /** Optional fallback UI to show on error */
  fallback?: ReactNode;
}

interface PluginErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for plugin-rendered content.
 * Catches React rendering errors and displays a fallback while
 * notifying the user via toast.
 */
export class PluginErrorBoundary extends Component<
  PluginErrorBoundaryProps,
  PluginErrorBoundaryState
> {
  constructor(props: PluginErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PluginErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { pluginSlug, pluginName } = this.props;
    const displayName = pluginName || pluginSlug;

    // Log detailed error for debugging
    console.error(
      `[PluginErrorBoundary] Error in plugin "${pluginSlug}":`,
      error,
      errorInfo.componentStack
    );

    // Show user-friendly toast
    showPluginErrorToast(displayName, error.message || 'An unexpected error occurred');
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Return fallback UI, or null if no fallback provided
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}

export default PluginErrorBoundary;
