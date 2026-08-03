import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import BackToHome from '@/components/flagship/BackToHome';
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
  test('given the header renders then it is pure brand: logo and more menu only', () => {
    render(<FlagshipHeader />);

    expect(screen.getByRole('button', { name: /policyengine home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more policyengine links/i })).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tracker/i })).not.toBeInTheDocument();
  });

  test('given the logo is clicked then it navigates to the flagship home', async () => {
    const user = userEvent.setup();
    render(<FlagshipHeader />);

    await user.click(screen.getByRole('button', { name: /policyengine home/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/home');
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

describe('BackToHome', () => {
  test('given the in-page link is clicked then it navigates to the launcher', async () => {
    const user = userEvent.setup();
    render(<BackToHome />);

    await user.click(screen.getByRole('button', { name: /back to home/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/home');
  });
});
