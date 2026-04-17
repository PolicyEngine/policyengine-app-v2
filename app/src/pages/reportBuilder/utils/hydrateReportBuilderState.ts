import type { AppHouseholdInputEnvelope as Household } from '@/models/household/appTypes';
import type { Geography } from '@/types/ingredients/Geography';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import type { UserReport } from '@/types/ingredients/UserReport';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import type { SimulationStateProps } from '@/types/pathwayState';
import { CURRENT_LAW_LABEL, fromApiPolicyId, isCurrentLaw } from '../currentLaw';
import type { ReportBuilderState } from '../types';

interface HydrateArgs {
  userReport: UserReport;
  report: Report;
  simulations: Simulation[];
  policies: Policy[];
  households: Household[];
  geographies: Geography[];
  userSimulations?: UserSimulation[];
  userPolicies?: UserPolicy[];
  userHouseholds?: UserHouseholdPopulation[];
  currentLawId: number;
}

function isHouseholdWithToAppInput(
  household: unknown
): household is { toAppInput: () => Household } {
  return (
    typeof household === 'object' &&
    household !== null &&
    'toAppInput' in household &&
    typeof (household as { toAppInput?: unknown }).toAppInput === 'function'
  );
}

function normalizeHousehold(
  household:
    | Household
    | {
        toAppInput: () => Household;
      }
    | undefined
): Household | null {
  if (!household) {
    return null;
  }

  if (isHouseholdWithToAppInput(household)) {
    return household.toAppInput();
  }

  return household;
}

export function hydrateReportBuilderState({
  userReport,
  report,
  simulations,
  policies,
  households,
  geographies,
  userSimulations,
  userPolicies,
  userHouseholds,
  currentLawId,
}: HydrateArgs): ReportBuilderState {
  const hydratedSimulations: SimulationStateProps[] = simulations.map((sim, index) => {
    // Find the user simulation label
    const userSim = userSimulations?.find((us) => us.simulationId === sim.id);
    const label = userSim?.label || `Simulation #${index + 1}`;

    // Hydrate policy
    const resolvedPolicyId = sim.policyId ? fromApiPolicyId(sim.policyId, currentLawId) : undefined;
    const policy = policies.find((p) => p.id === sim.policyId);
    const userPolicy = userPolicies?.find((up) => up.policyId === sim.policyId);

    const policyState = {
      id: resolvedPolicyId,
      label: isCurrentLaw(resolvedPolicyId)
        ? CURRENT_LAW_LABEL
        : userPolicy?.label || policy?.label || null,
      parameters: policy?.parameters || [],
    };

    // Hydrate population
    let populationState;
    if (sim.populationType === 'household') {
      const household = households.find((h) => h.id === sim.populationId);
      const userHousehold = userHouseholds?.find((uh) => uh.householdId === sim.populationId);
      populationState = {
        label: userHousehold?.label || null,
        type: 'household' as const,
        household: normalizeHousehold(household),
        geography: null,
      };
    } else {
      const geography = geographies.find(
        (g) => g.id === sim.populationId || g.geographyId === sim.populationId
      );
      populationState = {
        label: geography?.name || null,
        type: 'geography' as const,
        household: null,
        geography: geography || null,
      };
    }

    return {
      id: sim.id,
      label,
      countryId: sim.countryId,
      apiVersion: sim.apiVersion,
      status: sim.status,
      output: sim.output,
      policy: policyState,
      population: populationState,
    };
  });

  return {
    id: userReport.id,
    label: userReport.label || null,
    year: report.year || '',
    simulations: hydratedSimulations,
  };
}
