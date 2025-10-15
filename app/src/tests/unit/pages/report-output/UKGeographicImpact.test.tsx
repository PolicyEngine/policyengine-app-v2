import { describe, expect, test } from 'vitest';
import { render, screen } from '@test-utils';
import UKGeographicImpact from '@/pages/report-output/UKGeographicImpact';
import {
  mockUKEconomyOutput,
  mockUSEconomyOutput,
  mockGeographies,
} from '@/tests/fixtures/pages/report-output/UKGeographicImpactMocks';

describe('UKGeographicImpact', () => {
  describe('Component rendering', () => {
    test('given US economy output then displays unavailable message', () => {
      // When
      render(<UKGeographicImpact output={mockUSEconomyOutput} userGeography={null} />);

      // Then
      expect(
        screen.getByText('Geographic impact data is not available for this report.')
      ).toBeInTheDocument();
    });

    test('given no user geography then displays no selection message', () => {
      // When
      render(<UKGeographicImpact output={mockUKEconomyOutput} userGeography={null} />);

      // Then
      expect(screen.getByText('No geographic region selected for this report.')).toBeInTheDocument();
    });

    test('given UK-wide selection then displays analysis message', () => {
      // When
      render(
        <UKGeographicImpact
          output={mockUKEconomyOutput}
          userGeography={mockGeographies.ukNational}
        />
      );

      // Then
      expect(
        screen.getByText(/Geographic impact analysis is available when you select a specific region/)
      ).toBeInTheDocument();
    });
  });

  describe('Constituency data display', () => {
    test('given Brighton constituency then displays constituency impact', () => {
      // When
      render(
        <UKGeographicImpact
          output={mockUKEconomyOutput}
          userGeography={mockGeographies.brightonConstituency}
        />
      );

      // Then
      expect(screen.getByText(/Constituency Impact: Brighton Kemptown and Peacehaven/)).toBeInTheDocument();
      expect(screen.getByText('Average Household Income Change')).toBeInTheDocument();
      expect(screen.getByText('£1250.50')).toBeInTheDocument();
      expect(screen.getByText('Relative Change')).toBeInTheDocument();
      expect(screen.getByText('2.50%')).toBeInTheDocument();
    });

    test('given Aldershot constituency then displays negative impact', () => {
      // When
      render(
        <UKGeographicImpact
          output={mockUKEconomyOutput}
          userGeography={mockGeographies.aldershotConstituency}
        />
      );

      // Then
      expect(screen.getByText(/Constituency Impact: Aldershot/)).toBeInTheDocument();
      expect(screen.getByText('£-500.75')).toBeInTheDocument();
      expect(screen.getByText('-1.50%')).toBeInTheDocument();
    });

    test('given unknown constituency then displays unavailable message', () => {
      // When
      render(
        <UKGeographicImpact
          output={mockUKEconomyOutput}
          userGeography={mockGeographies.unknownConstituency}
        />
      );

      // Then
      expect(
        screen.getByText(/Data for constituency "Unknown" is not available/)
      ).toBeInTheDocument();
    });
  });

  describe('Country data display', () => {
    test('given England country then displays country impact summary', () => {
      // When
      render(
        <UKGeographicImpact
          output={mockUKEconomyOutput}
          userGeography={mockGeographies.englandCountry}
        />
      );

      // Then
      expect(screen.getByText(/Country Impact: england/)).toBeInTheDocument();
      expect(screen.getByText('Total Constituencies Analyzed')).toBeInTheDocument();
      expect(screen.getByText('550')).toBeInTheDocument(); // 150+120+80+30+170
    });

    test('given Scotland country then displays correct total', () => {
      // When
      render(
        <UKGeographicImpact
          output={mockUKEconomyOutput}
          userGeography={mockGeographies.scotlandCountry}
        />
      );

      // Then
      expect(screen.getByText(/Country Impact: scotland/)).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // 30+25+10+5+30
    });
  });

  describe('Edge cases', () => {
    test('given undefined constituency_impact then displays unavailable message', () => {
      // Given
      const outputWithoutConstituencyData = {
        ...mockUKEconomyOutput,
        constituency_impact: undefined,
      };

      // When
      render(
        <UKGeographicImpact
          output={outputWithoutConstituencyData as any}
          userGeography={mockGeographies.brightonConstituency}
        />
      );

      // Then
      expect(
        screen.getByText('Geographic impact data is not available for this report.')
      ).toBeInTheDocument();
    });

    test('given null constituency_impact then displays unavailable message', () => {
      // Given
      const outputWithNullData = {
        ...mockUKEconomyOutput,
        constituency_impact: null,
      };

      // When
      render(
        <UKGeographicImpact
          output={outputWithNullData as any}
          userGeography={mockGeographies.brightonConstituency}
        />
      );

      // Then
      expect(
        screen.getByText('Geographic impact data is not available for this report.')
      ).toBeInTheDocument();
    });
  });
});
