import { createContext, ReactNode, useContext } from 'react';

/**
 * Context to track whether we're inside a StandardLayout.
 * This prevents double-wrapping when pathways render their own StandardLayout
 * but the router has already provided one.
 */
const LayoutContext = createContext<boolean>(false);

/**
 * Provider that marks children as being inside a StandardLayout
 */
export function LayoutProvider({ children }: { children: ReactNode }) {
  return <LayoutContext.Provider value>{children}</LayoutContext.Provider>;
}

/**
 * Hook to check if we're already inside a StandardLayout
 */
export function useIsInsideLayout(): boolean {
  return useContext(LayoutContext);
}
