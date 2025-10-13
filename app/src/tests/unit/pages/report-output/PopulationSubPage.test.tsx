import { describe, test, expect } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import PopulationSubPage from '@/pages/report-output/PopulationSubPage';
import {
  mockHousehold,
  mockGeography,
  mockUserHousehold,
  createPopulationSubPageProps,
} from '@/tests/fixtures/pages/report-output/PopulationSubPage';

describe('PopulationSubPage', () => {
  test('given household type with no households then displays no data message', () => {
    // Given
    const props = createPopulationSubPageProps.emptyHousehold();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no household data available/i)).toBeInTheDocument();
  });

  test('given household type with undefined households then displays no data message', () => {
    // Given
    const props = createPopulationSubPageProps.undefinedHousehold();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no household data available/i)).toBeInTheDocument();
  });

  test('given geography type with no geographies then displays no data message', () => {
    // Given
    const props = createPopulationSubPageProps.emptyGeography();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no geography data available/i)).toBeInTheDocument();
  });

  test('given geography type with undefined geographies then displays no data message', () => {
    // Given
    const props = createPopulationSubPageProps.undefinedGeography();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/no geography data available/i)).toBeInTheDocument();
  });

  test('given household type with household then displays household information', () => {
    // Given
    const props = createPopulationSubPageProps.singleHousehold();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByRole('heading', { level: 2, name: /population information/i })).toBeInTheDocument();
    expect(screen.getByText(/type:/i)).toBeInTheDocument();
    const householdText = screen.getAllByText(/household/i);
    expect(householdText.length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 3, name: /household details/i })).toBeInTheDocument();
    expect(screen.getByText(mockHousehold.id!)).toBeInTheDocument();
  });

  test('given household with user association then displays user info', () => {
    // Given
    const props = createPopulationSubPageProps.singleHousehold();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/user association:/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockUserHousehold.userId))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockUserHousehold.label!))).toBeInTheDocument();
  });

  test('given household with people then displays people count and details', () => {
    // Given
    const props = createPopulationSubPageProps.singleHousehold();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/people:/i)).toBeInTheDocument();
    const peopleCount = screen.getAllByText(/2/);
    expect(peopleCount.length).toBeGreaterThan(0);
    const person1Elements = screen.getAllByText(/person1/);
    expect(person1Elements.length).toBeGreaterThan(0);
    const person2Elements = screen.getAllByText(/person2/);
    expect(person2Elements.length).toBeGreaterThan(0);
  });

  test('given household with families then displays family structure', () => {
    // Given
    const props = createPopulationSubPageProps.singleHousehold();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/families:/i)).toBeInTheDocument();
    const family1Elements = screen.getAllByText(/family1/);
    expect(family1Elements.length).toBeGreaterThan(0);
    const membersElements = screen.getAllByText(/Members: person1, person2/i);
    expect(membersElements.length).toBeGreaterThan(0);
  });

  test('given household with tax units then displays tax unit structure', () => {
    // Given
    const props = createPopulationSubPageProps.singleHousehold();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/tax units:/i)).toBeInTheDocument();
    expect(screen.getByText(/taxUnit1/)).toBeInTheDocument();
  });

  test('given multiple households then displays household selection buttons', () => {
    // Given
    const props = createPopulationSubPageProps.multipleHouseholds();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/select household:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /household 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /household 2/i })).toBeInTheDocument();
  });

  test('given user clicks household button then switches displayed household', async () => {
    // Given
    const user = userEvent.setup();
    const props = createPopulationSubPageProps.multipleHouseholds();
    render(<PopulationSubPage {...props} />);

    // When - initially shows first household
    expect(screen.getByText(mockHousehold.id!)).toBeInTheDocument();

    // When - click second household button
    await user.click(screen.getByRole('button', { name: /household 2/i }));

    // Then - shows second household ID
    expect(screen.getByText('hh-single-person-456')).toBeInTheDocument();
  });

  test('given single household then does not show selection buttons', () => {
    // Given
    const props = createPopulationSubPageProps.singleHousehold();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.queryByText(/select household:/i)).not.toBeInTheDocument();
  });

  test('given geography type with geography then displays geography information', () => {
    // Given
    const props = createPopulationSubPageProps.singleGeography();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByRole('heading', { level: 2, name: /population information/i })).toBeInTheDocument();
    expect(screen.getByText(/type:/i)).toBeInTheDocument();
    const geographyText = screen.getAllByText(/geography/i);
    expect(geographyText.length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 3, name: /geography details/i })).toBeInTheDocument();
    expect(screen.getByText(mockGeography.name!)).toBeInTheDocument();
  });

  test('given geography then displays all geography properties', () => {
    // Given
    const props = createPopulationSubPageProps.singleGeography();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/scope:/i)).toBeInTheDocument();
    expect(screen.getByText(/subnational/i)).toBeInTheDocument();
    expect(screen.getByText(mockGeography.geographyId!)).toBeInTheDocument();
  });

  test('given multiple geographies then displays geography selection buttons', () => {
    // Given
    const props = createPopulationSubPageProps.multipleGeographies();

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.getByText(/select geography:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /california/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new york/i })).toBeInTheDocument();
  });

  test('given user clicks geography button then switches displayed geography', async () => {
    // Given
    const user = userEvent.setup();
    const props = createPopulationSubPageProps.multipleGeographies();
    render(<PopulationSubPage {...props} />);

    // When - initially shows first geography
    const californiaElements = screen.getAllByText(/California/);
    expect(californiaElements.length).toBeGreaterThan(0);

    // When - click second geography button
    await user.click(screen.getByRole('button', { name: /new york/i }));

    // Then - shows second geography
    const newYorkElements = screen.getAllByText(/New York/);
    expect(newYorkElements.length).toBeGreaterThan(0);
  });

  test('given household without user association then does not show user info', () => {
    // Given
    const props = {
      households: [mockHousehold],
      geographies: [],
      userHouseholds: [],
      populationType: 'household' as const,
    };

    // When
    render(<PopulationSubPage {...props} />);

    // Then
    expect(screen.queryByText(/user association:/i)).not.toBeInTheDocument();
  });
});
