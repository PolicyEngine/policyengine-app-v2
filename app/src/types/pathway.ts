/**
 * Pathway Types - Base interfaces for PathwayWrapper components
 *
 * These interfaces define the common props and patterns used across all
 * PathwayWrapper implementations (Report, Simulation, Policy, Population).
 */

/**
 * PathwayWrapperProps - Base props for all PathwayWrapper components
 *
 * All PathwayWrappers accept:
 * - countryId: Determines which API and metadata to use
 * - onComplete: Optional callback when pathway successfully completes
 * - onCancel: Optional callback when user cancels pathway
 */
export interface PathwayWrapperProps {
  countryId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * ViewProps - Generic interface for view components within a pathway
 *
 * Views are stateless display components that receive:
 * - state: Current state of the pathway (type varies by pathway)
 * - currentMode: Current view mode enum value
 * - onNavigate: Function to navigate to a different mode
 * - onUpdateState: Function to update pathway state
 * - onComplete: Optional callback to complete the pathway
 * - onCancel: Optional callback to cancel the pathway
 *
 * @template TState - The state props type (e.g., ReportStateProps)
 * @template TMode - The view mode enum type (e.g., ReportViewMode)
 */
export interface ViewProps<TState, TMode> {
  state: TState;
  currentMode: TMode;
  onNavigate: (mode: TMode) => void;
  onUpdateState: (updates: Partial<TState>) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * PathwayWrapperState - Generic internal state structure for PathwayWrappers
 *
 * While PathwayWrappers use useState/useReducer internally, this interface
 * documents the common pattern of tracking both the ingredient state and
 * the current view mode.
 *
 * @template TState - The state props type (e.g., ReportStateProps)
 * @template TMode - The view mode enum type (e.g., ReportViewMode)
 */
export interface PathwayWrapperState<TState, TMode> {
  ingredientState: TState;
  currentMode: TMode;
  modeHistory?: TMode[]; // Optional: for back button navigation
}
