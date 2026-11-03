import { CURRENT_YEAR } from '@/constants';
import { getSamplePopulations } from '@/pages/reportBuilder/constants';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';

/** The report builder's populations: a household, or the whole country. */
export const REPORT_POPULATIONS = {
  HOUSEHOLD: 'household',
  SOCIETY_WIDE: 'nationwide',
} as const;

export type ReportPopulation = (typeof REPORT_POPULATIONS)[keyof typeof REPORT_POPULATIONS];

/** A one-simulation US report for the current year, run on the given population. */
export function reportStateFor(population: ReportPopulation): ReportBuilderState {
  const simulation = initializeSimulationState();
  simulation.label = 'Baseline simulation';
  simulation.population = getSamplePopulations('us')[population];
  return { label: null, year: CURRENT_YEAR, simulations: [simulation] };
}
