import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import GeographySubPage from './GeographySubPage';
import HouseholdSubPage from './HouseholdSubPage';

interface PopulationSubPageProps {
  baselineSimulation?: Simulation;
  reformSimulation?: Simulation;
  households?: Household[];
  geographies?: Geography[];
  userHouseholds?: UserHouseholdPopulation[];
}

/**
 * PopulationSubPage - Routes to the appropriate population component
 *
 * Receives baseline and reform simulations, extracts the population type and IDs,
 * then routes to either HouseholdSubPage or GeographySubPage with the appropriate data.
 */
export default function PopulationSubPage({
  baselineSimulation,
  reformSimulation,
  households,
  geographies,
  userHouseholds,
}: PopulationSubPageProps) {
  // Determine population type from simulations

  console.log(`[PopulationSubPage] userHouseholds:`, userHouseholds);

  const populationType = baselineSimulation?.populationType || reformSimulation?.populationType;

  if (!populationType) {
    return <div>No population data available</div>;
  }

  // Handle household population type
  if (populationType === 'household') {
    // Extract household IDs from simulations
    const baselineHouseholdId = baselineSimulation?.populationId;
    const reformHouseholdId = reformSimulation?.populationId;

    // Find the households
    const baselineHousehold = households?.find((h) => h.id === baselineHouseholdId);
    const reformHousehold = households?.find((h) => h.id === reformHouseholdId);

    return (
      <HouseholdSubPage
        baselineHousehold={baselineHousehold}
        reformHousehold={reformHousehold}
        userHouseholds={userHouseholds}
      />
    );
  }

  // Handle geography population type
  if (populationType === 'geography') {
    // Extract geography IDs from simulations
    const baselineGeographyId = baselineSimulation?.populationId;
    const reformGeographyId = reformSimulation?.populationId;

    // Debug logging for geography lookup
    console.log('Geography Lookup Debug:', {
      baselineGeographyId,
      reformGeographyId,
      availableGeographies: geographies,
      geographyIds: geographies?.map((g) => g.id),
      geographyGeographyIds: geographies?.map((g) => g.geographyId),
    });

    // Find the geographies - match by full id
    const baselineGeography = geographies?.find((g) => g.id === baselineGeographyId);
    const reformGeography = geographies?.find((g) => g.id === reformGeographyId);

    console.log('Geography Lookup Results:', {
      baselineGeography,
      reformGeography,
      foundBaseline: !!baselineGeography,
      foundReform: !!reformGeography,
    });

    return (
      <GeographySubPage baselineGeography={baselineGeography} reformGeography={reformGeography} />
    );
  }

  return <div>Invalid population type</div>;
}
