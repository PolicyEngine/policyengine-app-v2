import type { Geography } from '@/types/ingredients/Geography';
import type { Household } from '@/types/ingredients/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
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
  userGeographies?: UserGeographyPopulation[];
  currentLawId: number;
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
  userGeographies,
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
        household: household || null,
        geography: null,
      };
    } else {
      const geography = geographies.find(
        (g) => g.id === sim.populationId || g.geographyId === sim.populationId
      );
      const userGeography = userGeographies?.find((ug) => ug.geographyId === sim.populationId);
      populationState = {
        label: userGeography?.label || geography?.name || null,
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
