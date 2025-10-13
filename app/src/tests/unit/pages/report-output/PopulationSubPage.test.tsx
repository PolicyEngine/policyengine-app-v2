import { describe, test, expect } from 'vitest';
import { render, screen } from '@test-utils';
import PopulationSubPage from '@/pages/report-output/PopulationSubPage';
import {
  mockHousehold,
  mockGeography,
  mockUserHousehold,
} from '@/tests/fixtures/pages/PopulationSubPageMocks';

describe('PopulationSubPage', () => {
  test('given household type with no households then displays no data message', () => {
    // Given
    const props = {
      households: [],
      geographies: [],
      userHouseholds: [],
      populationType: 'household' as const,
    };

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no household data available/i)).toBeInTheDocument();
  });

  test('given household type with undefined households then displays no data message', () => {
    // Given
    const props = {
      households: undefined,
      geographies: undefined,
      userHouseholds: undefined,
      populationType: 'household' as const,
    };

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no household data available/i)).toBeInTheDocument();
  });

  test('given geography type with no geographies then displays no data message', () => {
    // Given
    const props = {
      households: [],
      geographies: [],
      userHouseholds: [],
      populationType: 'geography' as const,
    };

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no geography data available/i)).toBeInTheDocument();
  });

  test('given geography type with undefined geographies then displays no data message', () => {
    // Given
    const props = {
      households: undefined,
      geographies: undefined,
      userHouseholds: undefined,
      populationType: 'geography' as const,
    };

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no geography data available/i)).toBeInTheDocument();
  });

  test('given household type with households then displays placeholder content', () => {
    // Given
    const props = {
      households: [mockHousehold],
      geographies: [],
      userHouseholds: [mockUserHousehold],
      populationType: 'household' as const,
    };

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/population sub-page \(placeholder\)/i)).toBeInTheDocument();
    expect(screen.getByText(/population type: household/i)).toBeInTheDocument();
    expect(screen.getByText(/number of households: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/number of user households: 1/i)).toBeInTheDocument();
  });

  test('given geography type with geographies then displays placeholder content', () => {
    // Given
    const props = {
      households: [],
      geographies: [mockGeography],
      userHouseholds: [],
      populationType: 'geography' as const,
    };

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/population sub-page \(placeholder\)/i)).toBeInTheDocument();
    expect(screen.getByText(/population type: geography/i)).toBeInTheDocument();
    expect(screen.getByText(/number of geographies: 1/i)).toBeInTheDocument();
  });

  test('given household type without user households then displays zero user households', () => {
    // Given
    const props = {
      households: [mockHousehold],
      geographies: [],
      userHouseholds: undefined,
      populationType: 'household' as const,
    };

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/number of user households: 0/i)).toBeInTheDocument();
  });
});
