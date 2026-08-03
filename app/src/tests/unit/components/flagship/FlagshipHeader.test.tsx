import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import FlagshipHeader from '@/components/flagship/FlagshipHeader';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/us/ask', search: '' }),
    useParams: () => ({ countryId: 'us' }),
  };
});

describe('FlagshipHeader', () => {
  test('given the header renders then brand, all four verbs, and the primary action show', () => {
    render(<FlagshipHeader />);

    expect(screen.getByAltText('PolicyEngine')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ask$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tracker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^build$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reform/i })).toBeInTheDocument();
  });

  test('given the current route then that tab is marked current', () => {
    render(<FlagshipHeader />);

    expect(screen.getByRole('button', { name: /^ask$/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /tracker/i })).not.toHaveAttribute('aria-current');
  });

  test('given a tab is clicked then it navigates to that route', async () => {
    const user = userEvent.setup();
    render(<FlagshipHeader />);

    await user.click(screen.getByRole('button', { name: /tracker/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/tracker');
  });

  test('given new reform is clicked then it opens the composer in build', async () => {
    const user = userEvent.setup();
    render(<FlagshipHeader />);

    await user.click(screen.getByRole('button', { name: /new reform/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/build');
  });

  test('given the more menu is opened then website links are available', async () => {
    const user = userEvent.setup();
    render(<FlagshipHeader />);

    await user.click(screen.getByRole('button', { name: /more policyengine links/i }));

    expect(await screen.findByRole('menuitem', { name: /research/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /donate/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /github/i })).toBeInTheDocument();
  });
});
