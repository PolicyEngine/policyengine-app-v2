import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import CountryLayout from '../../../../../calculator-app/src/app/[countryId]/layout';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// The provider tree fetches metadata; this suite is about the layout's own
// validation, so the providers pass their children straight through.
vi.mock('../../../../../calculator-app/src/app/[countryId]/providers', () => ({
  CalculatorProviders: ({ children }: { children: React.ReactNode }) => children,
}));

/** Route params as Next.js passes them, already resolved so `use()` reads them synchronously. */
function resolvedParams(countryId: string) {
  const value = { countryId };
  return Object.assign(Promise.resolve(value), { status: 'fulfilled', value });
}

function CountryProbe() {
  return <p>Country: {useCurrentCountry()}</p>;
}

describe('calculator country layout', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  test('given a supported country then the page renders with that country', () => {
    render(
      <CountryLayout params={resolvedParams('uk')}>
        <CountryProbe />
      </CountryLayout>
    );
    expect(screen.getByText('Country: uk')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  test('given an unsupported country then nothing renders and the route is replaced with /', () => {
    const { container } = render(
      <CountryLayout params={resolvedParams('xx')}>
        <CountryProbe />
      </CountryLayout>
    );
    expect(container).toBeEmptyDOMElement();
    expect(replace).toHaveBeenCalledWith('/');
  });
});
