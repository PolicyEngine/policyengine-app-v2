import { Box, Text } from '@mantine/core';
import { GroupEntity } from '@/utils/householdIndividuals';
import { colors, spacing, typography } from '@/designTokens';
import EntityInstanceDisplay from './EntityInstanceDisplay';

interface GroupEntityDisplayProps {
  baselineEntity?: GroupEntity;
  reformEntity?: GroupEntity;
  baselineLabel: string;
  reformLabel: string;
  isSameHousehold: boolean;
}

/**
 * GroupEntityDisplay - Displays a single group entity type with all its instances
 *
 * Shows the entity type header (e.g., "Your household", "Your tax unit")
 * and renders all instances of that entity type.
 */
export default function GroupEntityDisplay({
  baselineEntity,
  reformEntity,
  baselineLabel,
  reformLabel,
  isSameHousehold,
}: GroupEntityDisplayProps) {
  // Get the entity type name (e.g., "Your household", "Your tax unit")
  const entityTypeName = baselineEntity?.entityTypeName || reformEntity?.entityTypeName || '';
  const entityType = baselineEntity?.entityType || reformEntity?.entityType || '';

  // Get all instances (merging by ID)
  const allInstanceIds = new Set<string>();
  baselineEntity?.instances.forEach((inst) => allInstanceIds.add(inst.id));
  reformEntity?.instances.forEach((inst) => allInstanceIds.add(inst.id));
  const sortedInstanceIds = Array.from(allInstanceIds).sort();

  // Determine if we need to show instance headers (when there are multiple instances)
  const showInstanceHeaders = sortedInstanceIds.length > 1;

  return (
    <Box style={{ marginTop: spacing['3xl'] }}>
      {/* Entity type header (e.g., "Your household") */}
      <Text
        size="xl"
        fw={typography.fontWeight.bold}
        c={colors.text.primary}
        style={{ marginBottom: spacing.lg }}
      >
        {entityTypeName}
      </Text>

      {sortedInstanceIds.map((instanceId) => {
        // Find this instance in baseline and reform
        const baselineInstance = baselineEntity?.instances.find((inst) => inst.id === instanceId);
        const reformInstance = reformEntity?.instances.find((inst) => inst.id === instanceId);

        return (
          <EntityInstanceDisplay
            key={instanceId}
            baselineInstance={baselineInstance}
            reformInstance={reformInstance}
            entityType={entityType}
            showInstanceHeader={showInstanceHeaders}
            baselineLabel={baselineLabel}
            reformLabel={reformLabel}
            isSameHousehold={isSameHousehold}
          />
        );
      })}
    </Box>
  );
}
