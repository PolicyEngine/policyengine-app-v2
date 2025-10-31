import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import Sidebar from '@/components/Sidebar';

// Mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/us/reports' }),
    useParams: () => ({ countryId: 'us' }),
  };
});

describe('Sidebar', () => {
  test('given sidebar renders then displays new report button', () => {
    // When
    render(<Sidebar />);

    // Then
    expect(screen.getByRole('button', { name: /new report/i })).toBeInTheDocument();
  });

  test('given user clicks new report button then navigates to create', async () => {
    // Given
    const user = userEvent.setup();
    render(<Sidebar />);

    // When
    await user.click(screen.getByRole('button', { name: /new report/i }));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('/us/reports/create');
  });

  test('given contact support link then has mailto href', () => {
    // When
    render(<Sidebar />);

    // Then
    const contactLink = screen.getByText('Contact Support').closest('a');
    expect(contactLink).toHaveAttribute('href', 'mailto:hello@policyengine.org');
  });

  test('given github link then has correct href', () => {
    // When
    render(<Sidebar />);

    // Then
    const githubLink = screen.getByText('GitHub').closest('a');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/PolicyEngine');
  });
});
