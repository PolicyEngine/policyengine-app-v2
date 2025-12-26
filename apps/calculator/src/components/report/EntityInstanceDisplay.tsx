import { Box, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { GroupEntityInstance } from '@/utils/householdIndividuals';
import IndividualTable from './IndividualTable';

interface EntityInstanceDisplayProps {
  baselineInstance?: GroupEntityInstance;
  reformInstance?: GroupEntityInstance;
  entityType: string;
  showInstanceHeader: boolean;
  baselineLabel: string;
  reformLabel: string;
  isSameHousehold: boolean;
}

/**
 * EntityInstanceDisplay - Displays a single instance of a group entity
 *
 * For people: Shows each member with their variables
 * For other entities: Shows entity-level variables only
 */
export default function EntityInstanceDisplay({
  baselineInstance,
  reformInstance,
  entityType,
  showInstanceHeader,
  baselineLabel,
  reformLabel,
  isSameHousehold,
}: EntityInstanceDisplayProps) {
  const instanceName = baselineInstance?.name || reformInstance?.name || '';

  // Get all members for this instance (used for people entities)
  const allMemberIds = new Set<string>();
  baselineInstance?.members.forEach((m) => allMemberIds.add(m.id));
  reformInstance?.members.forEach((m) => allMemberIds.add(m.id));
  const sortedMemberIds = Array.from(allMemberIds).sort();

  // Check if entity has entity-level variables
  const hasEntityVariables =
    (baselineInstance?.variables?.length ?? 0) > 0 || (reformInstance?.variables?.length ?? 0) > 0;

  return (
    <Box style={{ marginTop: showInstanceHeader ? spacing.lg : 0 }}>
      {/* Instance header - shown when there are multiple instances */}
      {showInstanceHeader && (
        <Text
          size="lg"
          fw={typography.fontWeight.semibold}
          c={colors.text.primary}
          style={{ marginBottom: spacing.md }}
        >
          {instanceName}
        </Text>
      )}

      {/* For non-people entities: Display entity-level variables */}
      {hasEntityVariables && entityType !== 'people' && (
        <Box style={{ marginTop: spacing.md }}>
          <IndividualTable
            baselineMember={
              baselineInstance?.variables
                ? {
                    id: baselineInstance.id,
                    name: baselineInstance.name,
                    variables: baselineInstance.variables,
                  }
                : undefined
            }
            reformMember={
              reformInstance?.variables
                ? {
                    id: reformInstance.id,
                    name: reformInstance.name,
                    variables: reformInstance.variables,
                  }
                : undefined
            }
            baselineLabel={baselineLabel}
            reformLabel={reformLabel}
            isSameHousehold={isSameHousehold}
          />
        </Box>
      )}

      {/* For people entity: Display each person */}
      {entityType === 'people' &&
        sortedMemberIds.map((memberId) => {
          // Find this member in baseline and reform instances
          const baselineMember = baselineInstance?.members.find((m) => m.id === memberId);
          const reformMember = reformInstance?.members.find((m) => m.id === memberId);

          // Member name (e.g., "You", "Your first dependent")
          const memberName = baselineMember?.name || reformMember?.name || memberId;

          // If entity has multiple members, show member name as subheader
          const showMemberHeader = sortedMemberIds.length > 1;

          return (
            <Box key={memberId} style={{ marginTop: spacing.md }}>
              {showMemberHeader && (
                <Text
                  size="md"
                  fw={typography.fontWeight.medium}
                  c={colors.text.secondary}
                  style={{ marginBottom: spacing.sm }}
                >
                  {memberName}
                </Text>
              )}

              <IndividualTable
                baselineMember={baselineMember}
                reformMember={reformMember}
                baselineLabel={baselineLabel}
                reformLabel={reformLabel}
                isSameHousehold={isSameHousehold}
              />
            </Box>
          );
        })}
    </Box>
  );
}
