import { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

export function createCountryWrapper(countryId: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[`/${countryId}`]}>
        <Routes>
          <Route path="/:countryId" element={children} />
          <Route path="/:countryId/*" element={children} />
        </Routes>
      </MemoryRouter>
    );
  };
}
