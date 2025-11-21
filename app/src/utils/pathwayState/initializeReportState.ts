import { CURRENT_YEAR } from '@/constants';
import { ReportStateProps } from '@/types/pathwayState';
import { initializeSimulationState } from './initializeSimulationState';

/**
 * Creates an empty ReportStateProps object with default values
 *
 * Used to initialize report state in ReportPathwayWrapper.
 * Includes nested simulation state (which itself contains nested policy/population).
 * Matches the default state from reportReducer.ts but as a plain object
 * with nested ingredient state.
 *
 * @param countryId - Required country ID for the report
 * @returns Initialized report state with two empty simulations
 */
export function initializeReportState(countryId: string): ReportStateProps {
  return {
    id: undefined,
    label: null,
    year: CURRENT_YEAR,
    countryId: countryId as any, // Type assertion for countryIds type
    apiVersion: null,
    status: 'pending',
    outputType: undefined,
    output: null,
    simulations: [initializeSimulationState(), initializeSimulationState()],
  };
}
