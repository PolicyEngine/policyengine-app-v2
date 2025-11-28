import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import MainSection from '@/components/home/MainSection';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/homeHeader/CountrySelectorMocks';

describe('MainSection', () => {
  test('given US country then displays US-specific text', () => {
    // When
    renderWithCountry(<MainSection />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByText(/all 50 states/i)).toBeInTheDocument();
  });

  test('given UK country then displays UK-specific text', () => {
    // When
    renderWithCountry(<MainSection />, TEST_COUNTRY_IDS.UK);

    // Then
    expect(screen.getByText(/across the UK/i)).toBeInTheDocument();
  });

  test('given component renders then displays hero title', () => {
    // When
    renderWithCountry(<MainSection />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByRole('heading', { name: /start simulating/i })).toBeInTheDocument();
  });

  test('given component renders then displays subtitle text', () => {
    // When
    renderWithCountry(<MainSection />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByText(/free, open-source tax and benefit analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/benefit access tools/i)).toBeInTheDocument();
  });
});
