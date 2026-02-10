import { createContext, ReactNode, useContext } from 'react';

/**
 * App Mode Context
 *
 * Provides information about which app is currently running (website or calculator).
 * This enables shared components to make context-aware decisions, such as:
 * - Using relative paths for same-app navigation (website)
 * - Using absolute URLs for cross-app navigation (calculator → website)
 *
 * USAGE:
 * ```tsx
 * // In app root
 * <AppProvider mode="website">
 *   <App />
 * </AppProvider>
 *
 * // In components
 * const appMode = useAppMode();
 * const href = appMode === 'website' ? '/us/research' : 'https://policyengine.org/us/research';
 * ```
 */

export type AppMode = 'website' | 'calculator';

const AppContext = createContext<AppMode | null>(null);

/**
 * Hook to access the current app mode.
 *
 * @throws Error if used outside of AppProvider
 * @returns 'website' or 'calculator'
 */
export function useAppMode(): AppMode {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error(
      'useAppMode must be used within an AppProvider. ' +
        'Wrap your app with <AppProvider mode="website"> or <AppProvider mode="calculator">.'
    );
  }
  return context;
}

interface AppProviderProps {
  mode: AppMode;
  children: ReactNode;
}

/**
 * Provider for app mode context.
 *
 * Place at the root of your app to enable context-aware navigation in shared components.
 */
export function AppProvider({ mode, children }: AppProviderProps) {
  return <AppContext.Provider value={mode}>{children}</AppContext.Provider>;
}
