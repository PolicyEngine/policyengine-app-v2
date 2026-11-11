import { createContext, useContext } from 'react';

interface AppLocation {
  pathname: string;
  search: string;
}

const LocationContext = createContext<AppLocation | null>(null);

export const LocationProvider = LocationContext.Provider;

export function useAppLocation(): AppLocation {
  const location = useContext(LocationContext);
  if (!location) {
    throw new Error('useAppLocation must be used within a LocationProvider');
  }
  return location;
}

export function useAppPathname(): string {
  return useAppLocation().pathname;
}

/**
 * The current pathname without requiring a LocationProvider: the
 * provider's when one is mounted, otherwise the window's, and '' when
 * rendering on the server without one.
 */
export function useCurrentPathname(): string {
  const location = useContext(LocationContext);
  if (location) {
    return location.pathname;
  }
  return typeof window === 'undefined' ? '' : window.location.pathname;
}
