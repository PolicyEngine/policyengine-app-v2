import { useSelector } from 'react-redux';
import GroupEntityDisplay from '@/components/report/GroupEntityDisplay';
import { RootState } from '@/store';
import { Household } from '@/types/ingredients/Household';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { extractGroupEntities } from '@/utils/householdIndividuals';
import { householdsAreEqual } from '@/utils/householdTableData';

interface HouseholdSubPageProps {
  baselineHousehold?: Household;
  reformHousehold?: Household;
  userHouseholds?: UserHouseholdPopulation[];
}

/**
 * HouseholdSubPage - Displays household population information in Design 4 table format
 *
 * Shows baseline and reform households side-by-side in a comparison table.
 * Displays all configured input values extracted from householdData.
 * Collapses columns when both simulations use the same household.
 */
export default function HouseholdSubPage({
  baselineHousehold,
  reformHousehold,
  userHouseholds,
}: HouseholdSubPageProps) {
  // Get metadata for variable formatting
  const variables = useSelector((state: RootState) => state.metadata.variables);

  if (!baselineHousehold && !reformHousehold) {
    return <div>No household data available</div>;
  }

  // Check if households are the same
  const householdsSame = householdsAreEqual(baselineHousehold, reformHousehold);

  // Get custom labels from userHouseholds, fallback to generic labels
  const baselineUserHousehold = userHouseholds?.find(
    (uh) => uh.householdId === baselineHousehold?.id
  );
  const reformUserHousehold = userHouseholds?.find((uh) => uh.householdId === reformHousehold?.id);

  const baselineLabel = baselineUserHousehold?.label || 'Baseline';
  const reformLabel = reformUserHousehold?.label || 'Reform';

  // Extract group entities from both households with metadata for proper formatting
  const baselineGroupEntities = baselineHousehold
    ? extractGroupEntities(baselineHousehold, variables)
    : [];
  const reformGroupEntities = reformHousehold
    ? extractGroupEntities(reformHousehold, variables)
    : [];

  // Collect all unique entity types
  const allEntityTypes = new Set<string>();
  baselineGroupEntities.forEach((ge) => allEntityTypes.add(ge.entityType));
  reformGroupEntities.forEach((ge) => allEntityTypes.add(ge.entityType));

  // Convert to sorted array (we want consistent ordering)
  const sortedEntityTypes = Array.from(allEntityTypes).sort();

  return (
    <div>
      <h2>Population Information</h2>

      {sortedEntityTypes.map((entityType) => {
        // Find the group entities for this type in both baseline and reform
        const baselineEntity = baselineGroupEntities.find((ge) => ge.entityType === entityType);
        const reformEntity = reformGroupEntities.find((ge) => ge.entityType === entityType);

        return (
          <GroupEntityDisplay
            key={entityType}
            baselineEntity={baselineEntity}
            reformEntity={reformEntity}
            baselineLabel={baselineLabel}
            reformLabel={reformLabel}
            isSameHousehold={householdsSame}
          />
        );
      })}
    </div>
  );
}
