import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import CalculatorLaunchPage from '@/components/calculator/CalculatorLaunchPage';

describe('CalculatorLaunchPage', () => {
  test('given US country then renders SPM-specific launch copy', () => {
    renderWithCountry(<CalculatorLaunchPage />, 'us', '/us', 'calculator');

    expect(
      screen.getByRole('heading', {
        name: /run supplemental poverty measure calculations and policy reports/i,
      })
    ).toBeInTheDocument();
  });

  test('given non-US or UK country then renders generic launch copy', () => {
    renderWithCountry(<CalculatorLaunchPage />, 'ca', '/ca', 'calculator');

    expect(
      screen.getByRole('heading', {
        name: /run household calculations and policy reports/i,
      })
    ).toBeInTheDocument();
    expect(screen.queryByText(/supplemental poverty measure/i)).not.toBeInTheDocument();
  });
});
