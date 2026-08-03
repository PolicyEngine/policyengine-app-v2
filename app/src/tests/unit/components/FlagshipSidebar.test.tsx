import { render, screen } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Sidebar from '@/components/Sidebar';
import { setFlagshipShellEnabled } from '@/libs/featureFlags';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/us/ask' }),
    useParams: () => ({ countryId: 'us' }),
  };
});

describe('Sidebar with flagship shell flag', () => {
  afterEach(() => {
    setFlagshipShellEnabled(false);
  });

  test('given the flag is off then legacy nav items show', () => {
    // When
    render(<Sidebar />);

    // Then
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Simulations')).toBeInTheDocument();
    expect(screen.queryByText('Ask')).not.toBeInTheDocument();
  });

  test('given the flag is on then the four flagship verbs show instead', () => {
    // Given
    setFlagshipShellEnabled(true);

    // When
    render(<Sidebar />);

    // Then
    expect(screen.getByText('Ask')).toBeInTheDocument();
    expect(screen.getByText('Tracker')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.queryByText('Simulations')).not.toBeInTheDocument();
  });
});
