import { render, screen, userEvent } from '@test-utils';
import { act, cleanup, fireEvent, render as renderBare } from '@testing-library/react';
import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import NavItem, { DropdownItem, NavItemSetup } from '@/components/homeHeader/NavItem';
import { LocationProvider } from '@/contexts/LocationContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import {
  MOCK_DROPDOWN_NAV_ITEM,
  MOCK_SIMPLE_NAV_ITEM,
} from '@/tests/fixtures/components/homeHeader/NavItemMocks';

describe('NavItem', () => {
  describe('Simple link behavior', () => {
    test('given simple nav item then displays label', () => {
      // Given/When
      render(<NavItem setup={MOCK_SIMPLE_NAV_ITEM} />);

      // Then
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    test('given simple nav item clicked then callback is invoked', async () => {
      // Given
      const user = userEvent.setup();
      const onClick = vi.fn();
      const navItem = { ...MOCK_SIMPLE_NAV_ITEM, onClick };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('Home'));

      // Then
      expect(onClick).toHaveBeenCalledOnce();
    });

    test('given simple nav item then renders as anchor', () => {
      // Given/When
      render(<NavItem setup={MOCK_SIMPLE_NAV_ITEM} />);

      // Then
      const link = screen.getByText('Home');
      expect(link.tagName).toBe('A');
    });
  });

  describe('Dropdown behavior', () => {
    test('given dropdown nav item then displays label with chevron', () => {
      // Given/When
      render(<NavItem setup={MOCK_DROPDOWN_NAV_ITEM} />);

      // Then
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    test('given dropdown nav item then does not show dropdown items initially', () => {
      // Given/When
      render(<NavItem setup={MOCK_DROPDOWN_NAV_ITEM} />);

      // Then
      expect(screen.queryByText('Team')).not.toBeInTheDocument();
      expect(screen.queryByText('Supporters')).not.toBeInTheDocument();
    });

    test('given dropdown clicked then shows dropdown items', async () => {
      // Given
      const user = userEvent.setup();
      render(<NavItem setup={MOCK_DROPDOWN_NAV_ITEM} />);

      // When
      await user.click(screen.getByText('About'));

      // Then
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Supporters')).toBeInTheDocument();
    });

    test('given dropdown item clicked then callback is invoked', async () => {
      // Given
      const user = userEvent.setup();
      const onTeamClick = vi.fn();
      const navItem = {
        ...MOCK_DROPDOWN_NAV_ITEM,
        dropdownItems: [
          { label: 'Team', onClick: onTeamClick },
          { label: 'Supporters', onClick: vi.fn() },
        ],
      };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('About'));
      await user.click(screen.getByText('Team'));

      // Then
      expect(onTeamClick).toHaveBeenCalledOnce();
    });

    test('given dropdown nav item with empty items then renders dropdown', async () => {
      // Given
      const user = userEvent.setup();
      const navItem = {
        label: 'Empty',
        onClick: vi.fn(),
        hasDropdown: true,
        dropdownItems: [],
      };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('Empty'));

      // Then
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    test('given dropdown parent clicked then parent callback is invoked', async () => {
      // Given
      const user = userEvent.setup();
      const onParentClick = vi.fn();
      const navItem = { ...MOCK_DROPDOWN_NAV_ITEM, onClick: onParentClick };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('About'));

      // Then
      expect(onParentClick).toHaveBeenCalledOnce();
    });
  });

  describe('Edge cases', () => {
    test('given hasDropdown true but no dropdownItems then renders as simple link', () => {
      // Given
      const navItem = {
        label: 'NoItems',
        onClick: vi.fn(),
        hasDropdown: true,
        // No dropdownItems provided
      };

      // When
      render(<NavItem setup={navItem} />);

      // Then
      const link = screen.getByText('NoItems');
      expect(link.tagName).toBe('A');
    });

    test('given hasDropdown false with dropdownItems then renders as simple link', () => {
      // Given
      const navItem = {
        label: 'ShouldBeSimple',
        onClick: vi.fn(),
        hasDropdown: false,
        dropdownItems: [{ label: 'Hidden', onClick: vi.fn() }],
      };

      // When
      render(<NavItem setup={navItem} />);

      // Then
      const link = screen.getByText('ShouldBeSimple');
      expect(link.tagName).toBe('A');
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    test('given multiple dropdown items then all are clickable', async () => {
      // Given
      const user = userEvent.setup();
      const onTeamClick = vi.fn();
      const onSupportersClick = vi.fn();
      const navItem = {
        ...MOCK_DROPDOWN_NAV_ITEM,
        dropdownItems: [
          { label: 'Team', onClick: onTeamClick },
          { label: 'Supporters', onClick: onSupportersClick },
        ],
      };

      // When
      render(<NavItem setup={navItem} />);
      await user.click(screen.getByText('About'));
      await user.click(screen.getByText('Team'));

      // Re-open dropdown for second item
      await user.click(screen.getByText('About'));
      await user.click(screen.getByText('Supporters'));

      // Then
      expect(onTeamClick).toHaveBeenCalledOnce();
      expect(onSupportersClick).toHaveBeenCalledOnce();
    });
  });

  describe('Dropdown rows', () => {
    /** Renders the item with a navigation spy, and opens its dropdown. */
    function renderOpen(dropdownItems: DropdownItem[]) {
      const push = vi.fn();
      const setup: NavItemSetup = { label: 'Menu', hasDropdown: true, dropdownItems };
      renderBare(
        <NavigationProvider value={{ push, replace: vi.fn(), back: vi.fn() }}>
          <LocationProvider value={{ pathname: '/us', search: '' }}>
            <NavItem setup={setup} />
          </LocationProvider>
        </NavigationProvider>
      );
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
      return { push };
    }

    // jsdom can't follow a link, so a document listener, which runs after
    // React's handlers, stops the browser default. It first records whether
    // the app had already prevented it.
    let defaultPreventedByApp: boolean | undefined;
    let clickTargets: (EventTarget | null)[] = [];
    function preventNavigation(event: Event) {
      clickTargets.push(event.target);
      defaultPreventedByApp = event.defaultPrevented;
      event.preventDefault();
    }

    /**
     * The navigations jsdom reported. It can't navigate or open a window, so it
     * logs an error for each: location.assign, setting location.href, following
     * a link, or window.open.
     */
    function navigationsReported(consoleError: { mock: { calls: unknown[][] } }) {
      return consoleError.mock.calls
        .map(([first]) => String((first as Error | undefined)?.message ?? first))
        .filter((message) =>
          /Not implemented: (navigation|window\.open|HTMLFormElement\.prototype\.(submit|requestSubmit))/.test(
            message
          )
        );
    }

    beforeEach(() => {
      defaultPreventedByApp = undefined;
      clickTargets = [];
    });

    afterEach(() => {
      document.removeEventListener('click', preventNavigation);
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    test('given a row linking to another site then it is a link to that URL', () => {
      // Given/When
      renderOpen([{ label: 'GiveCalc', href: 'https://policyengine.org/us/givecalc' }]);

      // Then
      expect(screen.getByRole('link', { name: 'GiveCalc' })).toHaveAttribute(
        'href',
        'https://policyengine.org/us/givecalc'
      );
      expect(screen.queryByRole('button', { name: 'GiveCalc' })).not.toBeInTheDocument();
    });

    test.each([
      ['a plain', {}],
      ['a Cmd', { metaKey: true }],
      ['a Ctrl', { ctrlKey: true }],
      ['a Shift', { shiftKey: true }],
    ])(
      'given %s click on a row linking to another site then the browser follows it, not the router',
      async (_, modifiers) => {
        // Given
        const { push } = renderOpen([
          { label: 'GiveCalc', href: 'https://policyengine.org/us/givecalc' },
        ]);
        expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
          'aria-expanded',
          'true'
        );
        // Added after the menu opens, so the listener sees only the row's click.
        document.addEventListener('click', preventNavigation);
        const consoleError = vi.spyOn(console, 'error');
        const url = window.location.href;
        const historyLength = window.history.length;
        vi.useFakeTimers();

        // When
        const row = screen.getByRole('link', { name: 'GiveCalc' });
        fireEvent.click(row, modifiers);
        // Whatever the click deferred, to a timer or a microtask, runs now.
        await act(() => vi.runAllTimersAsync());

        // Then
        // The row's click was the only one to reach the document, with its
        // default intact, and the app navigated no other way jsdom can see: no
        // router push, no navigation, window.open or form submission reported,
        // and no change to the URL, which history.pushState would make.
        expect(clickTargets).toEqual([row]);
        expect(defaultPreventedByApp).toBe(false);
        expect(push).not.toHaveBeenCalled();
        expect(navigationsReported(consoleError)).toEqual([]);
        expect(window.location.href).toBe(url);
        expect(window.history.length).toBe(historyLength);
        expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
          'aria-expanded',
          'false'
        );
      }
    );

    test('given a row with an in-app href then it is a button that navigates in-app', () => {
      // Given
      const { push } = renderOpen([{ label: 'Team', href: '/us/team' }]);

      // When
      fireEvent.click(screen.getByRole('button', { name: 'Team' }));

      // Then
      expect(push).toHaveBeenCalledWith('/us/team');
      expect(screen.queryByRole('link', { name: 'Team' })).not.toBeInTheDocument();
    });

    // For any rows, nested ones included: a row is a link exactly when it has an
    // href that isn't a path in this app, and then it links to that href.
    test('given any rows then exactly the rows not linking into this app are links, each to its own URL', () => {
      // Each kind of href, and whether its row should be a link.
      const kinds: Record<string, { href?: (slug: string) => string; link: boolean }> = {
        site: { href: (slug) => `https://policyengine.org/us/${slug}`, link: true },
        schemeRelative: { href: (slug) => `//policyengine.org/us/${slug}`, link: true },
        backslash: { href: (slug) => `/\\policyengine.org/us/${slug}`, link: true },
        hash: { href: (slug) => `#${slug}`, link: true },
        mailto: { href: (slug) => `mailto:${slug}@policyengine.org`, link: true },
        relative: { href: (slug) => slug, link: true },
        // The URL parser drops tabs and line breaks, so "/<tab>/host" names
        // another host. Any href with one is left for the browser to parse.
        tab: { href: (slug) => `/\t/policyengine.org/us/${slug}`, link: true },
        newline: { href: (slug) => `/\n/policyengine.org/us/${slug}`, link: true },
        carriageReturn: { href: (slug) => `/\r/policyengine.org/us/${slug}`, link: true },
        inAppWithTab: { href: (slug) => `/us/\t${slug}`, link: true },
        inApp: { href: (slug) => `/us/${slug}`, link: false },
        callback: { link: false },
      };
      const kind = fc.constantFrom(...Object.keys(kinds));
      const slug = fc.constantFrom('givecalc', 'team', 'model/rules', 'a', 'x-y');
      const row = fc.record({ kind, slug });
      const tree = fc.array(fc.record({ row, children: fc.array(row, { maxLength: 2 }) }), {
        minLength: 1,
        maxLength: 4,
      });

      fc.assert(
        fc.property(tree, (shape) => {
          let n = 0;
          const expectLink = new Map<string, boolean>();
          const toItem = (spec: { kind: string; slug: string }): DropdownItem => {
            const label = `Row ${n++}`;
            const { href, link } = kinds[spec.kind];
            expectLink.set(label, link);
            return href ? { label, href: href(spec.slug) } : { label, onClick: vi.fn() };
          };
          const items = shape.map(({ row, children }) => ({
            ...toItem(row),
            children: children.map(toItem),
          }));

          renderOpen(items);
          try {
            for (const item of items.flatMap((top) => [top, ...top.children])) {
              if (expectLink.get(item.label)) {
                expect(screen.getByRole('link', { name: item.label })).toHaveAttribute(
                  'href',
                  item.href
                );
              } else {
                expect(screen.getByRole('button', { name: item.label })).toBeInTheDocument();
              }
            }
          } finally {
            cleanup();
          }
        }),
        { numRuns: 60 }
      );
    });
  });
});
