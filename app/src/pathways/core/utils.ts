import { PathwayConfig } from './types';

/**
 * Gets a transition from a pathway config by name.
 *
 * @param config - The pathway configuration
 * @param viewKey - The view key to get transitions for
 * @param transitionName - The transition name ('next' or 'back')
 * @param state - The current state (needed for dynamic transitions)
 * @param pathwayName - The pathway name (for error logging)
 * @returns The target view key, or undefined if transition doesn't exist
 */
export function getPathwayTransition<TKey extends string, TState>(
  config: PathwayConfig<TKey, TState>,
  viewKey: TKey,
  transitionName: 'next' | 'back',
  state: TState,
  pathwayName: string
): TKey | undefined {
  const transitions = config.transitions[viewKey];

  if (!transitions) {
    console.error(
      `Unable to find transition of name "${transitionName}" within pathway "${pathwayName}" for view "${viewKey}"`
    );
    return undefined;
  }

  const transition = transitions[transitionName];

  if (!transition) {
    console.error(
      `Unable to find transition of name "${transitionName}" within pathway "${pathwayName}" for view "${viewKey}"`
    );
    return undefined;
  }

  // Handle dynamic transitions (functions)
  if (typeof transition === 'function') {
    return transition(state);
  }

  // Handle static transitions
  return transition;
}
