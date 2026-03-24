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
