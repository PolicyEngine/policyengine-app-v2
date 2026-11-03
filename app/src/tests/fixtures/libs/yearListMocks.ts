import metadataReducer, { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { store, type RootState } from '@/store';
import type { MetadataApiPayload, MetadataTimePeriod } from '@/types/metadata';

/** Every year from the first to the last, as a metadata year list gives them. */
export function timePeriodsFrom(firstYear: number, lastYear: number): MetadataTimePeriod[] {
  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => ({
    name: firstYear + index,
    label: String(firstYear + index),
  }));
}

/** The year lists the tests load into metadata. */
export const YEAR_LISTS = {
  /** The US society-wide years once the Public API starts them at 2024. */
  US_SOCIETY_WIDE_FROM_2024: timePeriodsFrom(2024, 2035),
  /** The US household years in household_options.time_period. */
  US_HOUSEHOLD: timePeriodsFrom(2022, 2035),
  /** The UK society-wide years today. */
  UK_SOCIETY_WIDE_TODAY: timePeriodsFrom(2024, 2030),
  /** The UK household years in household_options.time_period. */
  UK_HOUSEHOLD: timePeriodsFrom(2024, 2032),
} as const;

/** The years of a year list, as menu options give them. */
export function yearValues(timePeriods: readonly MetadataTimePeriod[]): string[] {
  return timePeriods.map((timePeriod) => String(timePeriod.name));
}

export interface YearListMetadata {
  /** economy_options.time_period */
  societyWideYears: MetadataTimePeriod[];
  /** household_options.time_period */
  householdYears: MetadataTimePeriod[];
}

/** A metadata response with the given year lists and nothing else of note. */
export function metadataPayloadWithYearLists({
  societyWideYears,
  householdYears,
}: YearListMetadata): MetadataApiPayload {
  return {
    status: 'ok',
    message: null,
    result: {
      variables: {},
      parameters: {},
      entities: {},
      variableModules: {},
      economy_options: { region: [], time_period: societyWideYears, datasets: [] },
      household_options: { time_period: householdYears },
      current_law_id: 2,
      basicInputs: [],
      modelled_policies: { core: {}, filtered: {} },
      version: 'test',
    },
  };
}

const YEAR_LIST_REQUEST_ID = 'year-list-metadata';

function yearListActions(yearLists: YearListMetadata, country: string) {
  return [
    fetchMetadataThunk.pending(YEAR_LIST_REQUEST_ID, country),
    fetchMetadataThunk.fulfilled(
      { data: metadataPayloadWithYearLists(yearLists), country },
      YEAR_LIST_REQUEST_ID,
      country
    ),
  ];
}

/** The app state after the metadata response loads, parsed by the metadata reducer. */
export function stateWithYearLists(yearLists: YearListMetadata, country = 'us'): RootState {
  const metadata = yearListActions(yearLists, country).reduce(
    (state, action) => metadataReducer(state, action),
    metadataReducer(undefined, { type: 'init' })
  );
  return { metadata } as RootState;
}

/** Loads the metadata response into the app store, as a metadata fetch would. */
export function seedYearListMetadata(yearLists: YearListMetadata, country = 'us'): void {
  yearListActions(yearLists, country).forEach((action) => store.dispatch(action));
}
