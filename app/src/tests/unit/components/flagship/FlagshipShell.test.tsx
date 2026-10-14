import { renderWithCountry, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import FlagshipShell from '@/components/flagship/FlagshipShell';
import SidePanel from '@/components/flagship/SidePanel';
import { clearDraftReform } from '@/libs/draftReform';
import { mockScreenWidth, SCREEN_WIDTHS } from '@/tests/fixtures/hooks/useMediaQueryMocks';

/** The v3 pages, which get the phone layout. */
const FLAGSHIP_PATHS = ['/us/build', '/us/reforms', '/us/report/abc123', '/uk/report/bill/hr-1'];

/** The legacy v2 pages the shell also hosts while the flag is on. */
const LEGACY_PATHS = [
  '/us/report-output/abc123',
  '/us/report-output/abc123/overview',
  '/us/reports',
  '/us/reports/create',
  '/us/simulations',
  '/us/policies',
  '/us/households',
];

/** The shell's classes before the phone layout, which legacy pages keep. */
const LEGACY_CLASSES = {
  root: 'tw:h-screen tw:overflow-hidden tw:flex tw:flex-col',
  main: 'tw:flex-1 tw:min-w-0 tw:overflow-y-auto tw:overflow-x-hidden tw:p-[24px] tw:bg-gray-50',
  slot: 'tw:shrink-0 tw:flex tw:h-full tw:bg-gray-50',
};

function renderShell(path: string, children: React.ReactNode = 'Page content') {
  const countryId = path.split('/')[1];
  const view = renderWithCountry(<FlagshipShell>{children}</FlagshipShell>, countryId, path);
  const root = view.container.querySelector('[data-flagship-shell]') as HTMLElement;
  const slot = view.container.querySelector('#flagship-side-panel-slot') as HTMLElement;
  return { ...view, root, slot };
}

describe('FlagshipShell', () => {
  beforeEach(() => {
    clearDraftReform();
  });

  test.each(FLAGSHIP_PATHS)('given the v3 page %s then it gets the phone layout', (path) => {
    // When
    const { root, slot } = renderShell(path);

    // Then
    expect(root.className).toContain('tw:max-sm:[&_[data-slot=segmented-control]]:h-12');
    expect(root).toHaveClass('tw:h-dvh');
    expect(screen.getByRole('main')).toHaveClass('tw:p-lg', 'tw:sm:p-2xl');
    expect(slot).toHaveClass('tw:max-sm:h-auto');
  });

  test.each(LEGACY_PATHS)('given the legacy page %s then its layout is unchanged', (path) => {
    // When
    const { root, slot } = renderShell(path);

    // Then — no phone touch targets, padding or plane under the content
    expect(root.className).toBe(LEGACY_CLASSES.root);
    expect(root.className).not.toContain('max-sm');
    expect(screen.getByRole('main').className).toBe(LEGACY_CLASSES.main);
    expect(slot.className).toBe(LEGACY_CLASSES.slot);
  });
});

describe('FlagshipShell on a phone', () => {
  beforeEach(() => {
    clearDraftReform();
    sessionStorage.clear();
    mockScreenWidth(SCREEN_WIDTHS.PHONE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given the side panel opens as a drawer then the page under it is out of reach', async () => {
    // Given
    const user = userEvent.setup();
    renderShell(
      '/us/report/abc123',
      <SidePanel title="Adjust parameters" defaultOpen={false}>
        <p>panel body</p>
      </SidePanel>
    );

    // When
    await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));

    // Then — a modal drawer; the page and the top bar are inert
    expect(screen.getByRole('dialog', { name: 'Adjust parameters' })).toHaveAttribute(
      'aria-modal',
      'true'
    );
    expect(screen.getByRole('main', { hidden: true })).toHaveAttribute('inert');
    expect(screen.getByRole('banner', { hidden: true })).toHaveAttribute('inert');
  });

  test('given the drawer closes then the page is in reach again', async () => {
    // Given
    const user = userEvent.setup();
    renderShell(
      '/us/report/abc123',
      <SidePanel title="Adjust parameters" defaultOpen={false}>
        <p>panel body</p>
      </SidePanel>
    );
    await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));

    // When
    await user.keyboard('{Escape}');

    // Then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).not.toHaveAttribute('inert');
    expect(screen.getByRole('banner')).not.toHaveAttribute('inert');
  });
});
