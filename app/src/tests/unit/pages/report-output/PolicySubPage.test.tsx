import { describe, test, expect } from 'vitest';
import { render, screen } from '@test-utils';
import PolicySubPage from '@/pages/report-output/PolicySubPage';
import {
  mockBaselinePolicy,
  mockReformPolicy,
  mockUserBaselinePolicy,
  mockUserReformPolicy,
} from '@/tests/fixtures/pages/PolicySubPageMocks';

describe('PolicySubPage', () => {
  test('given no policies then displays no data message', () => {
    // Given
    const props = {
      policies: [],
      userPolicies: [],
      reportType: 'economy' as const,
    };

    // When
    render(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/no policy data available/i)).toBeInTheDocument();
  });

  test('given undefined policies then displays no data message', () => {
    // Given
    const props = {
      policies: undefined,
      userPolicies: undefined,
      reportType: 'economy' as const,
    };

    // When
    render(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/no policy data available/i)).toBeInTheDocument();
  });

  test('given policies then displays placeholder content', () => {
    // Given
    const props = {
      policies: [mockBaselinePolicy, mockReformPolicy],
      userPolicies: [mockUserBaselinePolicy, mockUserReformPolicy],
      reportType: 'economy' as const,
    };

    // When
    render(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/policy sub-page \(placeholder\)/i)).toBeInTheDocument();
    expect(screen.getByText(/report type: economy/i)).toBeInTheDocument();
    expect(screen.getByText(/number of policies: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/number of user policies: 2/i)).toBeInTheDocument();
  });

  test('given household report type then displays household type', () => {
    // Given
    const props = {
      policies: [mockBaselinePolicy],
      userPolicies: [],
      reportType: 'household' as const,
    };

    // When
    render(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/report type: household/i)).toBeInTheDocument();
  });

  test('given policies without user policies then displays zero user policies', () => {
    // Given
    const props = {
      policies: [mockBaselinePolicy],
      userPolicies: undefined,
      reportType: 'economy' as const,
    };

    // When
    render(<PolicySubPage {...props} />);

    // Then
    expect(screen.getByText(/number of user policies: 0/i)).toBeInTheDocument();
  });
});
