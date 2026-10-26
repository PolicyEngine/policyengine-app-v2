import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { CalculatorProviders } from '../../../../../calculator-app/src/app/[countryId]/providers';

const selectedLayout = vi.hoisted(() => ({ routeGroup: null as string | null }));
const mockUseFetchMetadata = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useSelectedLayoutSegment: () => selectedLayout.routeGroup,
}));

vi.mock('@/hooks/useMetadata', () => ({
  useFetchMetadata: mockUseFetchMetadata,
}));

// Outside production the providers load the journey profiler, which needs a window.
vi.mock('@/utils/journeyProfiler', () => ({}));

/** v3 after the switch: the workspace route group reads the v2 routes. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>();
  return {
    ...original,
    V3_API_ROUTES: 'v2',
    metadataRoutesForRouteGroup: (routeGroup: string | null) =>
      original.metadataRoutesForRouteGroup(routeGroup, 'v2'),
  };
});

function renderCountryPage(routeGroup: string | null) {
  selectedLayout.routeGroup = routeGroup;
  render(
    <CountryProvider value="us">
      <CalculatorProviders>
        <p>Country page</p>
      </CalculatorProviders>
    </CountryProvider>
  );
}

describe('CalculatorProviders metadata routes', () => {
  beforeEach(() => {
    mockUseFetchMetadata.mockClear();
  });

  test('given a v3 workspace page then metadata is fetched from the v3 routes', () => {
    // When
    renderCountryPage('(workspace)');

    // Then
    expect(screen.getByText('Country page')).toBeInTheDocument();
    expect(mockUseFetchMetadata).toHaveBeenLastCalledWith('us', 'v2');
  });

  test('given a legacy calculator page then metadata is fetched from v1', () => {
    // When
    renderCountryPage('(calculator)');

    // Then
    expect(mockUseFetchMetadata).toHaveBeenLastCalledWith('us', 'v1');
  });
});
