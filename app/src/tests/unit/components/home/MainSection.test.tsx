import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import MainSection from '@/components/home/MainSection';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/home-header/CountrySelectorMocks';

describe('MainSection', () => {
  test('given US country then displays analyze with z', () => {
    // When
    renderWithCountry(<MainSection />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByText(/analyze/i)).toBeInTheDocument();
    expect(screen.queryByText(/analyse/i)).not.toBeInTheDocument();
  });

  test('given UK country then displays analyse with s', () => {
    // When
    renderWithCountry(<MainSection />, TEST_COUNTRY_IDS.UK);

    // Then
    expect(screen.getByText(/analyse/i)).toBeInTheDocument();
  });

  test('given component renders then displays hero title', () => {
    // When
    renderWithCountry(<MainSection />, TEST_COUNTRY_IDS.US);

    // Then
    expect(
      screen.getByRole('heading', { name: /computing public policy for everyone/i })
    ).toBeInTheDocument();
  });

  test('given component renders then displays subtitle text', () => {
    // When
    renderWithCountry(<MainSection />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByText(/understand and/i)).toBeInTheDocument();
    expect(screen.getByText(/the impacts of tax and benefit policies/i)).toBeInTheDocument();
  });
});
