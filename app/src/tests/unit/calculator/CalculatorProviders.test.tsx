import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { CalculatorProviders } from '../../../../../calculator-app/src/app/[countryId]/providers';

const selectedLayout = vi.hoisted(() => ({ segments: [] as string[] }));
const mockUseFetchMetadata = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useSelectedLayoutSegments: () => selectedLayout.segments,
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
    metadataRoutesForPage: (segments: string[]) => original.metadataRoutesForPage(segments, 'v2'),
  };
});

function renderCountryPage(segments: string[]) {
  selectedLayout.segments = segments;
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
    renderCountryPage(['(workspace)', 'build']);

    // Then
    expect(screen.getByText('Country page')).toBeInTheDocument();
    expect(mockUseFetchMetadata).toHaveBeenLastCalledWith('us', 'v2');
  });

  test('given a legacy calculator page then metadata is fetched from v1', () => {
    // When
    renderCountryPage(['(calculator)', 'reports']);

    // Then
    expect(mockUseFetchMetadata).toHaveBeenLastCalledWith('us', 'v1');
  });

  test('given the country index, which only redirects, then no metadata download starts', () => {
    renderCountryPage([]);

    expect(mockUseFetchMetadata).toHaveBeenLastCalledWith('us', null);
  });

  test.each([
    ['the old Home launcher, sent on to Build', ['(calculator)', 'home']],
    ['the old Library, sent on to Reforms', ['(calculator)', 'library']],
    ['the old bill tracker, sent on to Reforms', ['(calculator)', 'tracker']],
    ['the paused Ask page, sent on to Build', ['(workspace)', 'ask']],
  ])('given %s, which only redirects into v3, then no metadata download starts', (_, segments) => {
    renderCountryPage(segments);

    expect(mockUseFetchMetadata).toHaveBeenLastCalledWith('us', null);
  });
});
