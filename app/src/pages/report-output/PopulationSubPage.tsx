import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

interface PopulationSubPageProps {
  households?: Household[];
  geographies?: Geography[];
  userHouseholds?: UserHouseholdPopulation[];
  populationType: 'household' | 'geography';
}

/**
 * PopulationSubPage - Displays population information for a report
 *
 * This component shows household or geography data depending on the
 * population type used in the report's simulations.
 */
export default function PopulationSubPage({
  households,
  geographies,
  userHouseholds,
  populationType,
}: PopulationSubPageProps) {
  if (populationType === 'household' && (!households || households.length === 0)) {
    return <div>No household data available</div>;
  }

  if (populationType === 'geography' && (!geographies || geographies.length === 0)) {
    return <div>No geography data available</div>;
  }

  return (
    <div>
      <h2>Population Sub-Page (Placeholder)</h2>
      <p>Population Type: {populationType}</p>
      {populationType === 'household' && (
        <>
          <p>Number of Households: {households?.length || 0}</p>
          <p>Number of User Households: {userHouseholds?.length || 0}</p>
        </>
      )}
      {populationType === 'geography' && <p>Number of Geographies: {geographies?.length || 0}</p>}
    </div>
  );
}
