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
  test('given the header renders then it is minimal: brand, section label, and more menu only', () => {
    render(<FlagshipHeader />);

    expect(screen.getByRole('button', { name: /policyengine home/i })).toBeInTheDocument();
    expect(screen.getByText('Ask')).toBeInTheDocument(); // section label for /us/ask
    expect(screen.getByRole('button', { name: /more policyengine links/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tracker/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new reform/i })).not.toBeInTheDocument();
  });

  test('given the logo is clicked then it navigates to the flagship home', async () => {
    const user = userEvent.setup();
    render(<FlagshipHeader />);

    await user.click(screen.getByRole('button', { name: /policyengine home/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/home');
  });

  test('given a section then the breadcrumb offers a visible way back home', async () => {
    const user = userEvent.setup();
    render(<FlagshipHeader />);

    await user.click(screen.getByRole('button', { name: /^home$/i }));

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
