import { fireEvent, render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { countryIds } from '@/libs/countries';
import CountryError from '../../../../../calculator-app/src/app/[countryId]/(calculator)/error';
import WorkspaceError from '../../../../../calculator-app/src/app/[countryId]/(workspace)/error';
import GlobalError from '../../../../../calculator-app/src/app/error';
import { firstPathSegment, reportsHref } from '../../../../../calculator-app/src/app/reportsHref';

let mockPathname = '/';
let mockParams: Record<string, string> = {};

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useParams: () => mockParams,
}));

// The Reports link stays a plain <a>, so following it is a full page load
// that discards the client state that may have caused the error. A next/link
// would render with this marker.
vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => (
    <a data-next-link {...props}>
      {children}
    </a>
  ),
}));

const supportedReportsHrefs = countryIds.map((countryId) => `/${countryId}/reports`);

/** A path segment: any text without a slash. */
const pathSegment = fc.string({ unit: 'binary' }).map((segment) => segment.replaceAll('/', ''));

describe('reportsHref', () => {
  test.each(countryIds)(
    'given the supported country %s then it links to that country’s Reports page',
    (countryId) => {
      expect(reportsHref(countryId)).toBe(`/${countryId}/reports`);
    }
  );

  test.each([undefined, null, 0, {}, 'xx', 'UK', ' uk', 'uk ', '', '../uk', 'constructor'])(
    'given %j then it links to the US Reports page',
    (value) => {
      expect(reportsHref(value)).toBe('/us/reports');
    }
  );

  test('given a list of segments, as a catch-all route has, then it links to the US Reports page', () => {
    expect(reportsHref(['uk'])).toBe('/us/reports');
  });

  test('given any value then it links to a supported country’s Reports page', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(supportedReportsHrefs).toContain(reportsHref(value));
      })
    );
  });

  test('given any text that is not a supported country then it links to the US Reports page', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary' }), (value) => {
        fc.pre(!(countryIds as readonly string[]).includes(value));
        expect(reportsHref(value)).toBe('/us/reports');
      })
    );
  });
});

describe('firstPathSegment', () => {
  test.each(['/', '', '//'])('given %j then there is no first segment', (pathname) => {
    expect(firstPathSegment(pathname)).toBeUndefined();
  });

  test('given a path under a supported country then its first segment is that country', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...countryIds),
        fc.array(pathSegment),
        fc.boolean(),
        (countryId, rest, trailingSlash) => {
          const pathname = `/${[countryId, ...rest].join('/')}${trailingSlash ? '/' : ''}`;
          expect(firstPathSegment(pathname)).toBe(countryId);
        }
      )
    );
  });

  // Next.js decodes route params once with decodeURIComponent, and usePathname()
  // keeps the path's percent-encoding.
  test.each([
    ['/%75k/reports', 'uk'],
    ['/%75%6B', 'uk'],
    ['/%55K/reports', 'UK'],
    ['/%2575k/reports', '%75k'],
    ['/uk%2Freports', 'uk/reports'],
    ['/%E0%A4%A/reports', '%E0%A4%A'],
  ])('given the path %s then its first segment is %j', (pathname, segment) => {
    expect(firstPathSegment(pathname)).toBe(segment);
  });

  test('given a supported country with any of its letters percent-encoded then its first segment is that country', () => {
    const encodings = (letter: string) => {
      const hex = letter.charCodeAt(0).toString(16);
      return [letter, `%${hex.toLowerCase()}`, `%${hex.toUpperCase()}`];
    };
    fc.assert(
      fc.property(
        fc
          .constantFrom(...countryIds)
          .chain((countryId) =>
            fc.tuple(
              fc.constant(countryId),
              fc.tuple(...[...countryId].map((letter) => fc.constantFrom(...encodings(letter))))
            )
          ),
        fc.array(pathSegment),
        ([countryId, letters], rest) => {
          const pathname = `/${[letters.join(''), ...rest].join('/')}`;
          expect(firstPathSegment(pathname)).toBe(countryId);
        }
      )
    );
  });

  test('given any path then the Reports link from it is a supported country’s', () => {
    fc.assert(
      fc.property(fc.array(pathSegment), (segments) => {
        const pathname = `/${segments.join('/')}`;
        expect(supportedReportsHrefs).toContain(reportsHref(firstPathSegment(pathname)));
      })
    );
  });

  test('given any mix of percent signs, hex digits and slashes then finding the first segment does not throw', () => {
    const pathChar = fc.constantFrom('%', '/', '0', '5', '7', 'A', 'E', 'F', 'k', 'u');
    fc.assert(
      fc.property(
        fc.array(pathChar).map((chars) => `/${chars.join('')}`),
        (pathname) => {
          expect(() => firstPathSegment(pathname)).not.toThrow();
        }
      )
    );
  });
});

describe('calculator error pages', () => {
  const reset = vi.fn();
  const error = new Error('Test error');

  beforeEach(() => {
    mockPathname = '/';
    mockParams = {};
    reset.mockClear();
    // Each page logs the error it shows.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function reportsLink() {
    return screen.getByRole('link', { name: 'Go to reports' });
  }

  describe('root error page', () => {
    test.each([
      ['/uk/reports/123', '/uk/reports'],
      ['/uk', '/uk/reports'],
      // A country the calculator no longer offers.
      ['/ca/households', '/us/reports'],
      ['/us/reports', '/us/reports'],
      ['/', '/us/reports'],
      ['/xx/reports', '/us/reports'],
      ['/UK/reports', '/us/reports'],
      ['/llms.txt', '/us/reports'],
      ['/%75k/reports', '/uk/reports'],
      ['/%E0%A4%A/reports', '/us/reports'],
    ])('given the path %s then it links to %s', (pathname, href) => {
      mockPathname = pathname;
      render(<GlobalError error={error} reset={reset} />);
      expect(reportsLink()).toHaveAttribute('href', href);
    });

    test('given the Reports link then it is a plain link, not a client-side one', () => {
      mockPathname = '/uk/reports';
      render(<GlobalError error={error} reset={reset} />);
      expect(reportsLink()).not.toHaveAttribute('data-next-link');
    });

    test('given Try again is clicked then the page resets', () => {
      render(<GlobalError error={error} reset={reset} />);
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });

  // The workspace routes' error page re-exports the calculator routes' one.
  describe.each([
    ['calculator', CountryError],
    ['workspace', WorkspaceError],
  ])('%s routes error page', (_group, ErrorPage) => {
    test.each(countryIds)('given the country %s then it links to its Reports page', (countryId) => {
      mockParams = { countryId };
      render(<ErrorPage error={error} reset={reset} />);
      expect(reportsLink()).toHaveAttribute('href', `/${countryId}/reports`);
    });

    test('given a country segment that is not a supported country then it links to the US Reports page', () => {
      mockParams = { countryId: 'xx' };
      render(<ErrorPage error={error} reset={reset} />);
      expect(reportsLink()).toHaveAttribute('href', '/us/reports');
    });

    test('given no country in the route then it links to the US Reports page', () => {
      render(<ErrorPage error={error} reset={reset} />);
      expect(reportsLink()).toHaveAttribute('href', '/us/reports');
    });

    test('given the route country then it is taken from the route, not the path', () => {
      mockParams = { countryId: 'uk' };
      mockPathname = '/us/reports';
      render(<ErrorPage error={error} reset={reset} />);
      expect(reportsLink()).toHaveAttribute('href', '/uk/reports');
    });

    test('given the Reports link then it is a plain link, not a client-side one', () => {
      mockParams = { countryId: 'uk' };
      render(<ErrorPage error={error} reset={reset} />);
      expect(reportsLink()).not.toHaveAttribute('data-next-link');
    });

    test('given Try again is clicked then the page resets', () => {
      render(<ErrorPage error={error} reset={reset} />);
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });
});
