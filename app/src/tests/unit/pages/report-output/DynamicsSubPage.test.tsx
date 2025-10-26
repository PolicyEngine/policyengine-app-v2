import { render, screen } from '@test-utils';
import { describe, it, expect, vi } from 'vitest';
import DynamicsSubPage from '@/pages/report-output/DynamicsSubPage';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

describe('DynamicsSubPage', () => {
  it('given no dynamics parameters then shows empty state', () => {
    // Given
    const props = {
      policies: [],
      userPolicies: [],
      reportType: 'economy' as const,
    };

    // When
    render(<DynamicsSubPage {...props} />);

    // Then
    expect(screen.getByText('Dynamics Information')).toBeInTheDocument();
    expect(screen.getByText('No custom dynamics configuration for this report.')).toBeInTheDocument();
  });
});
