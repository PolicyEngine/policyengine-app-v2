import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import FlagshipTopNav from '@/components/flagship/FlagshipTopNav';

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

describe('FlagshipTopNav', () => {
  test('given the nav renders then all four verbs and the new reform button show', () => {
    render(<FlagshipTopNav />);

    expect(screen.getByRole('button', { name: /^ask$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tracker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^build$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reform/i })).toBeInTheDocument();
  });

  test('given the current route then that tab is marked current', () => {
    render(<FlagshipTopNav />);

    expect(screen.getByRole('button', { name: /^ask$/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /tracker/i })).not.toHaveAttribute('aria-current');
  });

  test('given a tab is clicked then it navigates to that route', async () => {
    const user = userEvent.setup();
    render(<FlagshipTopNav />);

    await user.click(screen.getByRole('button', { name: /tracker/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/tracker');
  });

  test('given new reform is clicked then it opens the composer in build', async () => {
    const user = userEvent.setup();
    render(<FlagshipTopNav />);

    await user.click(screen.getByRole('button', { name: /new reform/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/build');
  });
});
