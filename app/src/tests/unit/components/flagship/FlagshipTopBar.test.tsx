import { renderWithCountry, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';
import { colors } from '@/designTokens';
import { addDraftProvision, clearDraftReform, startDraftReform } from '@/libs/draftReform';
import { MOCK_COUNTRIES } from '@/tests/fixtures/components/homeHeader/CountrySelectorMocks';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/us/build', search: '' }),
    useParams: () => ({ countryId: 'us' }),
  };
});

function renderTopBar() {
  return renderWithCountry(<FlagshipTopBar />, 'us', '/us/build');
}

describe('FlagshipTopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDraftReform();
  });

  test('given the bar renders then both sections and the more menu are in the primary navigation', () => {
    renderTopBar();

    const primary = screen.getByRole('navigation', { name: 'Primary' });
    expect(primary).toContainElement(screen.getByRole('button', { name: 'Build' }));
    expect(primary).toContainElement(screen.getByRole('button', { name: 'Reforms' }));
    expect(primary).toContainElement(
      screen.getByRole('button', { name: /more policyengine links/i })
    );
  });

  test('given the Ask page is paused then it has no nav item', () => {
    renderTopBar();

    expect(screen.queryByRole('button', { name: 'Ask' })).not.toBeInTheDocument();
  });

  test('given the current route then its nav item is marked current', () => {
    renderTopBar();

    expect(screen.getByRole('button', { name: 'Build' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Reforms' })).not.toHaveAttribute('aria-current');
  });

  test('given a nav item is clicked then it navigates and is marked current at once', async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByRole('button', { name: 'Reforms' }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/reforms');
    expect(screen.getByRole('button', { name: 'Reforms' })).toHaveAttribute('aria-current', 'page');
  });

  test('given the brand is clicked then it navigates to the Build landing', async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByRole('button', { name: 'PolicyEngine' }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/build');
  });

  test('given the more menu is opened then the website links are offered', async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByRole('button', { name: /more policyengine links/i }));

    expect(await screen.findByRole('menuitem', { name: 'Research' })).toHaveAttribute(
      'href',
      expect.stringContaining('/us/research')
    );
    expect(screen.getByRole('menuitem', { name: 'GitHub' })).toBeInTheDocument();
  });

  test('given a draft on the build page then the bar does not link to it again', () => {
    startDraftReform('us', 'manual');
    addDraftProvision('us', {
      path: 'gov.irs.credits.ctc.amount.base',
      breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
      unit: 'currency-USD',
      baselineValue: 2000,
      value: 2000,
    });

    renderTopBar();

    // The mocked location is /us/build, where the draft already is.
    expect(screen.queryByRole('button', { name: /draft ·/i })).not.toBeInTheDocument();
  });

  test("given a phone's menu is opened then it offers both sections and the website links", async () => {
    // Given — the menu button a phone shows in place of the sections
    const user = userEvent.setup();
    renderTopBar();

    // When
    await user.click(screen.getByRole('button', { name: 'Menu' }));

    // Then
    expect(await screen.findByRole('menuitem', { name: 'Build' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('menuitem', { name: 'Reforms' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Research' })).toHaveAttribute(
      'href',
      expect.stringContaining('/us/research')
    );
  });

  test("given a section is chosen from a phone's menu then it navigates there", async () => {
    // Given
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: 'Menu' }));

    // When
    await user.click(await screen.findByRole('menuitem', { name: 'Reforms' }));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('/us/reforms');
  });

  test("given the bar renders then the country selector follows the sections and comes just before a phone's menu", () => {
    // Given
    renderTopBar();

    // When
    const selector = screen.getByRole('button', { name: /country selector/i });

    // Then — as in the legacy header: after its sections on a wide screen,
    // and just before the menu button on a phone
    const primary = screen.getByRole('navigation', { name: 'Primary' });
    expect(primary).not.toContainElement(selector);
    expect(primary.compareDocumentPosition(selector)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(selector.compareDocumentPosition(screen.getByRole('button', { name: 'Menu' }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  test('given the country selector is opened then it offers exactly the US and the UK', async () => {
    // Given
    const user = userEvent.setup();
    renderTopBar();
    const buttonsBeforeOpening = screen.getAllByRole('button');

    // When
    await user.click(screen.getByRole('button', { name: /country selector/i }));

    // Then
    const countryOptions = screen
      .getAllByRole('button')
      .filter((button) => !buttonsBeforeOpening.includes(button));
    expect(countryOptions).toHaveLength(MOCK_COUNTRIES.length);
    MOCK_COUNTRIES.forEach((country, index) => {
      expect(countryOptions[index]).toHaveTextContent(country.label);
    });
  });

  test('given the UK is chosen from the country selector then the same page opens for the UK', async () => {
    // Given
    const user = userEvent.setup();
    renderTopBar();
    await user.click(screen.getByRole('button', { name: /country selector/i }));

    // When
    await user.click(screen.getByRole('button', { name: /united kingdom/i }));

    // Then — the mocked location is /us/build
    expect(mockNavigate).toHaveBeenCalledWith('/uk/build');
  });

  test("given the bar's white background then the country selector's globe icon is dark", () => {
    // When
    renderTopBar();

    // Then
    const globeIcon = screen
      .getByRole('button', { name: /country selector/i })
      .querySelector('svg');
    expect(globeIcon).toHaveAttribute('stroke', colors.gray[700]);
  });
});
