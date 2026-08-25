import { createContext, useContext } from 'react';

interface NavigationFunctions {
  push: (path: string) => void;
  replace: (path: string) => void;
  back: () => void;
  /** Warm a route before it is visited. Only the Next.js router provides this. */
  prefetch?: (path: string) => void;
}

const NavigationContext = createContext<NavigationFunctions | null>(null);

export const NavigationProvider = NavigationContext.Provider;

export function useAppNavigate(): NavigationFunctions {
  const nav = useContext(NavigationContext);
  if (!nav) {
    throw new Error('useAppNavigate must be used within a NavigationProvider');
  }
  return nav;
}
