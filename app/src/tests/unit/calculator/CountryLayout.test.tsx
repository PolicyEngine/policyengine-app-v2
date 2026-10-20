import { notFound } from 'next/navigation';
import * as fs from 'fs';
import * as path from 'path';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { countryIds } from '@/libs/countries';
import CountryLayout from '../../../../../calculator-app/src/app/[countryId]/layout';

// Next.js's notFound() throws to stop rendering; the mock throws a marker so
// a 404 can be told apart from any other failure.
const { NOT_FOUND } = vi.hoisted(() => ({ NOT_FOUND: new Error('notFound()') }));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw NOT_FOUND;
  }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// The provider tree fetches metadata; this suite is about the layout's own
// validation, so the providers become a marked pass-through.
vi.mock('../../../../../calculator-app/src/app/[countryId]/providers', () => ({
  CalculatorProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="calculator-providers">{children}</div>
  ),
}));

function CountryProbe() {
  return <p>Country: {useCurrentCountry()}</p>;
}

/** The layout as Next.js calls it for a request whose first path segment is `countryId`. */
function renderLayout(countryId: string) {
  return CountryLayout({ params: Promise.resolve({ countryId }), children: <CountryProbe /> });
}

/** 'rendered' or 'not found'; any other failure is rethrown. */
async function outcome(countryId: string) {
  try {
    await renderLayout(countryId);
    return 'rendered';
  } catch (error) {
    if (error === NOT_FOUND) {
      return 'not found';
    }
    throw error;
  }
}

describe('calculator country layout', () => {
  beforeEach(() => {
    vi.mocked(notFound).mockClear();
  });

  test.each(countryIds)(
    'given the supported country %s then the calculator renders with that country',
    async (countryId) => {
      render(await renderLayout(countryId));

      expect(screen.getByTestId('calculator-providers')).toContainElement(
        screen.getByText(`Country: ${countryId}`)
      );
      expect(notFound).not.toHaveBeenCalled();
    }
  );

  test.each([
    // Files crawlers and browsers ask the calculator host for.
    'llms.txt',
    'llms-full.txt',
    'favicon.ico',
    'sitemap.xml',
    'wp-login.php',
    // Countries the calculator does not serve, or near misses of ones it does.
    'xx',
    'gb',
    'usa',
    'US',
    'Uk',
    ' us',
    'us ',
    '',
  ])('given the first path segment %j then the layout is a 404', async (segment) => {
    await expect(renderLayout(segment)).rejects.toBe(NOT_FOUND);
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  test('given any first path segment then the layout is a 404 exactly when it is not a supported country', async () => {
    const country = fc.constantFrom(...countryIds);
    const segment = fc.oneof(
      country,
      fc.string(),
      fc.string({ unit: 'binary' }),
      // A supported country with something around it, or in another case.
      fc
        .tuple(fc.string(), country, fc.string())
        .map(([before, id, after]) => `${before}${id}${after}`),
      country.map((id) => id.toUpperCase())
    );

    await fc.assert(
      fc.asyncProperty(segment, async (countryId) => {
        vi.mocked(notFound).mockClear();
        const supported = (countryIds as readonly string[]).includes(countryId);

        expect(await outcome(countryId)).toBe(supported ? 'rendered' : 'not found');
        expect(notFound).toHaveBeenCalledTimes(supported ? 0 : 1);
      })
    );
  });
});

describe('calculator paths outside the country segment', () => {
  const calculatorApp = path.resolve(__dirname, '../../../../../calculator-app');

  // Next.js serves public files and static route folders before the
  // [countryId] route, so an entry named exactly after a country would
  // shadow that country's calculator.
  test('given the calculator public folder then it is app/public', () => {
    expect(fs.realpathSync(path.join(calculatorApp, 'public'))).toBe(
      fs.realpathSync(path.join(calculatorApp, '../app/public'))
    );
  });

  test.each(['public', 'src/app'])(
    'given the top level of calculator-app/%s then no entry is named after a country',
    (folder) => {
      const names = fs.readdirSync(path.join(calculatorApp, folder));

      expect(names.filter((name) => (countryIds as readonly string[]).includes(name))).toEqual([]);
    }
  );
});
