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
    const contactLink = screen.getByText('Contact support').closest('a');
    expect(contactLink).toHaveAttribute('href', 'mailto:hello@policyengine.org');
  });

  test('given github link then has correct href', () => {
    // When
    render(<Sidebar />);

    // Then
    const githubLink = screen.getByText('GitHub').closest('a');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/PolicyEngine');
  });

  test('given join slack link then has correct href', () => {
    // When
    render(<Sidebar />);

    // Then
    const slackLink = screen.getByText('Join Slack').closest('a');
    expect(slackLink).toHaveAttribute(
      'href',
      'https://join.slack.com/t/policyengine-group/shared_invite/zt-3h69snorb-2MPNgFuRGucqGLG_15tijQ'
    );
  });

  test('given disabled link then shows tooltip on hover', async () => {
    // Given
    const user = userEvent.setup();
    render(<Sidebar />);

    // When
    const accountSettings = screen.getByText('Account settings');
    await user.hover(accountSettings);

    // Then — Radix Tooltip renders content with role="tooltip"
    expect(screen.getByRole('tooltip', { name: /under development/i })).toBeInTheDocument();
  });

  test('given isOpen=false then sidebar content is not rendered', () => {
    // When
    render(<Sidebar isOpen={false} />);

    // Then
    expect(screen.queryByRole('button', { name: /new report/i })).not.toBeInTheDocument();
  });

  test('given sidebar renders then root element uses 100% height', () => {
    // When
    const { container } = render(<Sidebar />);

    // Then — should use 100% (not 100vh) for AppShell compatibility
    const root = container.firstChild as HTMLElement;
    expect(root.style.height).not.toBe('100vh');
  });
});
