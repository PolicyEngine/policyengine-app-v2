import { describe, test, expect } from 'vitest';
import { render, screen } from '@test-utils';
import SimulationSubPage from '@/pages/report-output/SimulationSubPage';
import {
  mockBaselineSimulation,
  mockReformSimulation,
  mockHousehold,
  mockGeography,
  mockUserBaselineSimulation,
  mockUserReformSimulation,
} from '@/tests/fixtures/pages/SimulationSubPageMocks';
import { mockBaselinePolicy, mockReformPolicy } from '@/tests/fixtures/pages/report-output/PolicySubPage';

describe('SimulationSubPage', () => {
  test('given no simulations then displays no data message', () => {
    // Given
    const props = {
      simulations: [],
      policies: [],
      households: [],
      geographies: [],
      userSimulations: [],
    };

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no simulation data available/i)).toBeInTheDocument();
  });

  test('given undefined simulations then displays no data message', () => {
    // Given
    const props = {
      simulations: undefined,
      policies: undefined,
      households: undefined,
      geographies: undefined,
      userSimulations: undefined,
    };

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no simulation data available/i)).toBeInTheDocument();
  });

  test('given simulations then displays placeholder content', () => {
    // Given
    const props = {
      simulations: [mockBaselineSimulation, mockReformSimulation],
      policies: [mockBaselinePolicy, mockReformPolicy],
      households: [mockHousehold],
      geographies: [],
      userSimulations: [mockUserBaselineSimulation, mockUserReformSimulation],
    };

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/simulation sub-page \(placeholder\)/i)).toBeInTheDocument();
    expect(screen.getByText(/number of simulations: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/number of policies: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/number of households: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/number of user simulations: 2/i)).toBeInTheDocument();
  });

  test('given geography simulations then displays geography count', () => {
    // Given
    const props = {
      simulations: [mockBaselineSimulation],
      policies: [],
      households: [],
      geographies: [mockGeography],
      userSimulations: [],
    };

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/number of geographies: 1/i)).toBeInTheDocument();
  });

  test('given missing optional data then displays zero counts', () => {
    // Given
    const props = {
      simulations: [mockBaselineSimulation],
      policies: undefined,
      households: undefined,
      geographies: undefined,
      userSimulations: undefined,
    };

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/number of policies: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/number of households: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/number of geographies: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/number of user simulations: 0/i)).toBeInTheDocument();
  });
});
