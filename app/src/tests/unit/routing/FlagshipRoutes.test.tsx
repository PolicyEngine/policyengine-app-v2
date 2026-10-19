import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FlagshipRoutes } from '@/CalculatorRouter';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => mockCountry,
}));
let mockCountry = 'us';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path=":countryId">
          <Route element={<FlagshipRoutes />}>
            <Route path="build" element={<p>Build page</p>} />
          </Route>
          <Route path="reports" element={<p>Reports page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('FlagshipRoutes', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('given the US, where v3 is the default, then its flagship route renders', () => {
    mockCountry = 'us';
    renderAt('/us/build');
    expect(screen.getByText('Build page')).toBeInTheDocument();
  });

  test('given the UK flag off then its flagship route lands on Reports', () => {
    mockCountry = 'uk';
    vi.stubEnv('NEXT_PUBLIC_FLAGSHIP_SHELL_UK', 'false');
    renderAt('/uk/build');
    expect(screen.getByText('Reports page')).toBeInTheDocument();
  });

  test('given the UK with no flag of its own then its flagship route renders', () => {
    mockCountry = 'uk';
    renderAt('/uk/build');
    expect(screen.getByText('Build page')).toBeInTheDocument();
  });
});
