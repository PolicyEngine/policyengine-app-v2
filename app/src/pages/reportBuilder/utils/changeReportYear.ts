import { Household } from '@/models/Household';
import type { AppHouseholdInputGroup, AppHouseholdInputPerson } from '@/models/household/appTypes';
import { isYearValueMap } from '@/models/household/utils';
import type { ReportBuilderState } from '../types';

function inputCollections(household: Household) {
  return Object.values(household.householdData) as Array<
    Record<string, AppHouseholdInputPerson | AppHouseholdInputGroup> | undefined
  >;
}

export function householdInputYears(household: Household): string[] {
  const periods = new Set<string>();
  for (const entities of inputCollections(household)) {
    for (const entity of Object.values(entities ?? {})) {
      for (const value of Object.values(entity)) {
        if (isYearValueMap(value)) {
          Object.keys(value).forEach((period) => periods.add(period));
        }
      }
    }
  }
  return [...periods];
}

export function householdMatchesReportYear(household: Household, year: string): boolean {
  return (
    household.year === Number(year) &&
    householdInputYears(household).every((period) => period === year)
  );
}

/** Copy a single annual snapshot into a new draft, without aging or uprating. */
export function copyHouseholdToYear(household: Household, year: string): Household {
  if (!/^\d{4}$/.test(year)) {
    throw new Error('Choose a four-digit report year.');
  }
  const data = household.householdData;
  const collections = Object.values(data) as Array<
    Record<string, AppHouseholdInputPerson | AppHouseholdInputGroup> | undefined
  >;
  const periods = new Set(householdInputYears(household));
  if (periods.size > 1) {
    throw new Error(
      'This household contains inputs for multiple years. Edit its dated inputs explicitly or create a household for the selected year; changing the report year cannot choose which values to copy.'
    );
  }
  if ((periods.size === 0 || periods.has(year)) && household.year === Number(year)) {
    return household;
  }
  // The current household calculation API determines its period from this input.
  // Do not rename people or invent an age to make that inference succeed.
  if (data.people.you?.age === undefined || data.people.you.age === null) {
    throw new Error(
      'This household structure does not identify a calculation year supported by this editor. Re-create the household for the selected year in the household builder before running it.'
    );
  }
  for (const entities of collections) {
    for (const entity of Object.values(entities ?? {})) {
      for (const [variable, value] of Object.entries(entity)) {
        if (isYearValueMap(value)) {
          entity[variable] = { [year]: Object.values(value)[0] };
        }
      }
    }
  }
  return Household.fromAppInput({
    ...household.toJSON(),
    id: `draft-household-${crypto.randomUUID()}`,
    year: Number(year),
    householdData: data,
  });
}

/** Change only this report draft; saved inputs and policy date ranges retain ownership. */
export function changeReportYear(state: ReportBuilderState, year: string): ReportBuilderState {
  if (!/^\d{4}$/.test(year)) {
    throw new Error('Choose a four-digit report year.');
  }
  const copies: Array<{ original: Household; draft: Household }> = [];
  const simulations = state.simulations.map((simulation, index) => {
    const household = simulation.population.household;
    if (!household) {
      return simulation;
    }
    let draft = copies.find(({ original }) => original.isEqual(household))?.draft;
    if (!draft) {
      try {
        draft = copyHouseholdToYear(household, year);
      } catch (error) {
        throw new Error(
          `${index === 0 ? 'Baseline' : 'Reform'} household: ${error instanceof Error ? error.message : 'Unable to change input year.'}`
        );
      }
      copies.push({ original: household, draft });
    }
    if (draft === household) {
      return simulation;
    }
    return {
      ...simulation,
      id: undefined,
      status: 'pending' as const,
      output: null,
      population: { ...simulation.population, household: draft, householdNeedsCreation: true },
    };
  });
  return { ...state, year, simulations };
}
