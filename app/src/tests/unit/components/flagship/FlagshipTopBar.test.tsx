import { renderWithCountry, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';
import { addDraftProvision, clearDraftReform, startDraftReform } from '@/libs/draftReform';

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

  test('given the bar renders then both sections are in the primary navigation', () => {
    renderTopBar();

    const primary = screen.getByRole('navigation', { name: 'Primary' });
    expect(primary).toContainElement(screen.getByRole('button', { name: 'Build' }));
    expect(primary).toContainElement(screen.getByRole('button', { name: 'Reforms' }));
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
});
