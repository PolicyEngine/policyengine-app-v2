import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import HouseholdSubPage from './HouseholdSubPage';
import GeographySubPage from './GeographySubPage';

interface PopulationSubPageProps {
  households?: Household[];
  geographies?: Geography[];
  userHouseholds?: UserHouseholdPopulation[];
  populationType: 'household' | 'geography';
}

/**
 * PopulationSubPage - Routes to the appropriate population component
 *
 * This component determines the population type and renders either
 * HouseholdSubPage or GeographySubPage accordingly.
 */
export default function PopulationSubPage({
  households,
  geographies,
  userHouseholds,
  populationType,
}: PopulationSubPageProps) {
  // Handle household population type
  if (populationType === 'household') {
    if (!households || households.length === 0) {
      return <div>No household data available</div>;
    }

    return <HouseholdSubPage households={households} userHouseholds={userHouseholds} />;
  }

  // Handle geography population type
  if (populationType === 'geography') {
    if (!geographies || geographies.length === 0) {
      return <div>No geography data available</div>;
    }

    return <GeographySubPage geographies={geographies} />;
  }

  return <div>Invalid population type</div>;
}
