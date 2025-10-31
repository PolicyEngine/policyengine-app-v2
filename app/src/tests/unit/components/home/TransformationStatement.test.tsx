import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import TransformationStatement from '@/components/home/TransformationStatement';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/home-header/CountrySelectorMocks';

describe('TransformationStatement', () => {
  test('given US country then displays analyze with z', () => {
    // When
    renderWithCountry(<TransformationStatement />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByText(/analyze/i)).toBeInTheDocument();
  });

  test('given UK country then displays analyse with s', () => {
    // When
    renderWithCountry(<TransformationStatement />, TEST_COUNTRY_IDS.UK);

    // Then
    expect(screen.getByText(/analyse/i)).toBeInTheDocument();
  });

  test('given component renders then displays transformation statement', () => {
    // When
    renderWithCountry(<TransformationStatement />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByText(/transforming how policy professionals/i)).toBeInTheDocument();
  });
});
