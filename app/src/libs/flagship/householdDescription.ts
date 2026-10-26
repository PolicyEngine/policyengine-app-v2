import { STATE_NAMES } from '@/api/billFeed';
import type { Household } from '@/models/Household';
import type { VariableInfo } from '@/utils/VariableResolver';

/**
 * Who a v3 household result is for, in one line, and where the household
 * lives: a US household's state, a UK household's region.
 */

/** One of the household's own inputs in the year, e.g. its state or region. */
function householdValue(household: Household, variable: string, year: string): unknown {
  const householdKey = Object.keys(household.householdData.households ?? {})[0];
  return householdKey
    ? (household.householdData.households?.[householdKey] as any)?.[variable]?.[year]
    : undefined;
}

/** A US household's state ("CA"), once one is chosen; null elsewhere. */
export function householdState(
  household: Household,
  year: string,
  countryId: string
): string | null {
  if (countryId !== 'us') {
    return null;
  }
  const state = householdValue(household, 'state_name', year);
  return typeof state === 'string' && state ? state : null;
}

/**
 * Where the household lives, as a reader names it: a US state's name, a
 * UK region's label from the model ("SCOTLAND" is "Scotland"). Null until
 * one is chosen.
 */
export function householdPlace(
  household: Household,
  year: string,
  countryId: string,
  variables?: Record<string, VariableInfo>
): string | null {
  if (countryId === 'us') {
    const state = householdValue(household, 'state_name', year);
    return typeof state === 'string' && state ? (STATE_NAMES[state] ?? state) : null;
  }
  if (countryId === 'uk') {
    const region = householdValue(household, 'region', year);
    if (typeof region !== 'string' || !region) {
      return null;
    }
    return (
      variables?.region?.possibleValues?.find((option) => option.value === region)?.label ?? region
    );
  }
  return null;
}

/** "Married · 2 children · New York", "Single · no children · Scotland": who a result is for. */
export function describeHousehold(
  household: Household,
  year: string,
  countryId: string,
  variables?: Record<string, VariableInfo>
): string {
  const { maritalStatus, numChildren } = household.deriveBuilderComposition(year);
  const place = householdPlace(household, year, countryId, variables);
  return [
    maritalStatus === 'married' ? 'Married' : 'Single',
    numChildren === 0 ? 'no children' : numChildren === 1 ? '1 child' : `${numChildren} children`,
    ...(place ? [place] : []),
  ].join(' · ');
}
