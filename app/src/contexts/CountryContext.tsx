import { createContext, useContext } from 'react';
import type { CountryId } from '@/libs/countries';

const CountryContext = createContext<CountryId | null>(null);

export const CountryProvider = CountryContext.Provider;

export function useCountryContext(): CountryId | null {
  return useContext(CountryContext);
}
