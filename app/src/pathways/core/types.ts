/**
 * Core types for the pathway system.
 *
 * Pathways are multi-step flows for creating ingredients (policies, populations, reports, etc.).
 * This module defines the structure for views (individual steps) and pathway configurations
 * (navigation between steps).
 */

/**
 * A View represents a single step in a pathway.
 *
 * @template TKey - The unique identifier for this view
 * @template TState - The state type managed by this pathway
 */
export interface View<TKey extends string, TState> {
  /** Unique identifier for this view */
  key: TKey;

  /** The component to render for this view */
  component: React.ComponentType<{
    state: TState;
    onStateChange: (newState: Partial<TState>) => void;
    onNext: () => void;
    onBack: () => void;
    onCancel?: () => void;
  }>;

  /** Layout type for this view (defaults to 'standard') */
  layoutType?: 'standard' | 'custom';

  /** Optional validation function to check if user can proceed to next view */
  canProceed?: (state: TState) => boolean;
}

/**
 * A collection of views, keyed by their identifier.
 * This allows views to be easily imported and spread into other pathway configurations.
 */
export type ViewList<TKey extends string, TState> = {
  [K in TKey]: View<K, TState>;
};

/**
 * Configuration for pathway navigation.
 * Defines the initial view and transitions between views.
 *
 * @template TKey - The view key type
 * @template TState - The state type (optional, only needed for dynamic transitions)
 */
export interface PathwayConfig<TKey extends string, TState = any> {
  /** The view to show when the pathway starts */
  initialView: TKey;

  /** Transition rules for each view */
  transitions: {
    [K in TKey]?: {
      /** The view to navigate to when clicking "Next" (can be static or dynamic) */
      next?: TKey | ((state: TState) => TKey);
      /** The view to navigate to when clicking "Back" (can be static or dynamic) */
      back?: TKey | ((state: TState) => TKey);
    };
  };
}
