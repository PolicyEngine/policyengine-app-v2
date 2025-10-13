import { describe, test, expect } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import SimulationSubPage from '@/pages/report-output/SimulationSubPage';
import {
  mockBaselineSimulation,
  mockReformSimulation,
  mockHousehold,
  mockGeography,
  mockUserBaselineSimulation,
  createSimulationSubPageProps,
} from '@/tests/fixtures/pages/report-output/SimulationSubPage';
import { mockBaselinePolicy, mockReformPolicy } from '@/tests/fixtures/pages/report-output/PolicySubPage';

describe('SimulationSubPage', () => {
  test('given no simulations then displays no data message', () => {
    // Given
    const props = createSimulationSubPageProps.empty();

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no simulation data available/i)).toBeInTheDocument();
  });

  test('given undefined simulations then displays no data message', () => {
    // Given
    const props = createSimulationSubPageProps.undefined();

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no simulation data available/i)).toBeInTheDocument();
  });

  test('given single simulation then displays simulation information', () => {
    // Given
    const props = createSimulationSubPageProps.singleSimulation();

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/simulation information/i)).toBeInTheDocument();
    expect(screen.getByText(mockBaselineSimulation.id!)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: mockBaselineSimulation.label! })).toBeInTheDocument();
    expect(screen.getByText(mockBaselineSimulation.countryId!)).toBeInTheDocument();
  });

  test('given simulation with user association then displays user info', () => {
    // Given
    const props = createSimulationSubPageProps.singleSimulation();

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/user association/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockUserBaselineSimulation.userId))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockUserBaselineSimulation.label!))).toBeInTheDocument();
  });

  test('given multiple simulations then displays simulation selection buttons', () => {
    // Given
    const props = createSimulationSubPageProps.baselineAndReform();

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/select simulation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /baseline simulation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reform simulation/i })).toBeInTheDocument();
  });

  test('given user clicks simulation button then switches displayed simulation', async () => {
    // Given
    const user = userEvent.setup();
    const props = createSimulationSubPageProps.baselineAndReform();
    render(<SimulationSubPage {...props} />);

    // When - initially shows baseline
    const baselineIds = screen.getAllByText(mockBaselineSimulation.id!);
    expect(baselineIds.length).toBeGreaterThan(0);

    // When - click reform button
    await user.click(screen.getByRole('button', { name: /reform simulation/i }));

    // Then - shows reform ID
    const reformIds = screen.getAllByText(mockReformSimulation.id!);
    expect(reformIds.length).toBeGreaterThan(0);
  });

  test('given simulation with policy then displays associated policy', () => {
    // Given
    const props = {
      simulations: [mockBaselineSimulation],
      policies: [mockBaselinePolicy],
      households: [mockHousehold],
      geographies: [],
      userSimulations: [],
    };

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByRole('heading', { level: 3, name: /associated policy/i })).toBeInTheDocument();
    expect(screen.getByText(mockBaselineSimulation.policyId!)).toBeInTheDocument();
    expect(screen.getByText(mockBaselinePolicy.label!)).toBeInTheDocument();
  });

  test('given simulation without policy match then displays policy not found', () => {
    // Given
    const props = {
      simulations: [mockBaselineSimulation],
      policies: [mockReformPolicy], // Wrong policy - doesn't match simulation
      households: [mockHousehold],
      geographies: [],
      userSimulations: [],
    };

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/policy not found/i)).toBeInTheDocument();
  });

  test('given household simulation then displays associated household', () => {
    // Given
    const props = createSimulationSubPageProps.singleSimulation();

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByRole('heading', { level: 3, name: /associated population/i })).toBeInTheDocument();
    expect(screen.getByText(/population type/i)).toBeInTheDocument();
    const householdText = screen.getAllByText(/household/i);
    expect(householdText.length).toBeGreaterThan(0);
    const householdIds = screen.getAllByText(mockHousehold.id!);
    expect(householdIds.length).toBeGreaterThan(0);
  });

  test('given geography simulation then displays associated geography', () => {
    // Given
    const props = createSimulationSubPageProps.withGeography();

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByRole('heading', { level: 3, name: /associated population/i })).toBeInTheDocument();
    const geographyText = screen.getAllByText(/geography/i);
    expect(geographyText.length).toBeGreaterThan(0);
    expect(screen.getByText(mockGeography.name!)).toBeInTheDocument();
  });

  test('given simulation without population match then displays population not found', () => {
    // Given
    const props = {
      simulations: [mockBaselineSimulation],
      policies: [],
      households: [], // Empty - no household match
      geographies: [],
      userSimulations: [],
    };

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/population not found/i)).toBeInTheDocument();
  });

  test('given simulation shows created status', () => {
    // Given
    const props = createSimulationSubPageProps.singleSimulation();

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    const createdLabels = screen.getAllByText(/created:/i);
    expect(createdLabels.length).toBeGreaterThan(0);
    expect(screen.getByText(/yes/i)).toBeInTheDocument();
  });

  test('given single simulation then does not show selection buttons', () => {
    // Given
    const props = createSimulationSubPageProps.singleSimulation();

    // When
    render(<SimulationSubPage {...props} />);

    // Then
    expect(screen.queryByText(/select simulation/i)).not.toBeInTheDocument();
  });
});
