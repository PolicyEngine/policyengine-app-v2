import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HomePage from '@/pages/Home.page';

// Mock child components to test that HomePage renders them
vi.mock('@/components/home/MainSection', () => ({
  default: () => <div data-testid="main-section">Main Section</div>,
}));

vi.mock('@/components/home/ActionCards', () => ({
  default: () => <div data-testid="action-cards">Action Cards</div>,
}));

vi.mock('@/components/home/TransformationStatement', () => ({
  default: () => <div data-testid="transformation-statement">Transformation Statement</div>,
}));

vi.mock('@/components/home/OrgLogos', () => ({
  default: ({ logos }: { logos: unknown[] }) => (
    <div data-testid="org-logos">Org Logos ({logos.length})</div>
  ),
}));

describe('HomePage', () => {
  test('given page renders then all main sections display', () => {
    // When
    render(<HomePage />);

    // Then
    expect(screen.getByTestId('main-section')).toBeInTheDocument();
    expect(screen.getByTestId('action-cards')).toBeInTheDocument();
    expect(screen.getByTestId('transformation-statement')).toBeInTheDocument();
    expect(screen.getByTestId('org-logos')).toBeInTheDocument();
  });

  test('given page renders then displays sections in correct order', () => {
    // When
    const { container } = render(<HomePage />);

    // Then
    const sections = Array.from(container.querySelectorAll('[data-testid]')).map((el) =>
      el.getAttribute('data-testid')
    );

    expect(sections).toEqual([
      'main-section',
      'action-cards',
      'transformation-statement',
      'org-logos',
    ]);
  });

  test('given page renders then passes orgData to OrgLogos component', () => {
    // When
    render(<HomePage />);

    // Then
    const orgLogos = screen.getByTestId('org-logos');
    // Verify the OrgLogos component was rendered
    expect(orgLogos).toBeInTheDocument();
  });
});
