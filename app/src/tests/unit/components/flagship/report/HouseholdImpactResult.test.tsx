import type { ComponentProps } from 'react';
import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import { compareHouseholds } from '@/libs/flagship/householdRun';
import {
  HOUSEHOLD_YEAR,
  UK_BASELINE_RESULT,
  UK_REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

const UK_IMPACT = compareHouseholds(UK_BASELINE_RESULT, UK_REFORM_RESULT, HOUSEHOLD_YEAR, 'uk');
const UK_SUMMARY = 'Single · no children · £30,000 earnings · 2026';

describe('HouseholdImpactResult', () => {
  test('given no country then the props do not type-check, so no result reads as the US', () => {
    // @ts-expect-error The household's country is required: it sets the currency.
    const propsWithoutCountry: ComponentProps<typeof HouseholdImpactResult> = {
      impact: UK_IMPACT,
      summary: UK_SUMMARY,
    };

    expect(propsWithoutCountry).not.toHaveProperty('countryId');
  });

  test('given a UK household then its change in net income reads in pounds', () => {
    render(<HouseholdImpactResult impact={UK_IMPACT} summary={UK_SUMMARY} countryId="uk" />);

    expect(screen.getByRole('group', { name: 'Change in annual net income' })).toHaveTextContent(
      '£'
    );
  });
});
