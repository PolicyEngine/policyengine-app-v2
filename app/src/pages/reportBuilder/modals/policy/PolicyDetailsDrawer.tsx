/**
 * PolicyDetailsDrawer - Sliding panel showing policy parameter details
 */
import { useMemo, useState } from 'react';
import { IconChevronRight, IconPencil, IconX } from '@tabler/icons-react';
import { ActionIcon, Box, Button, Group, Stack, Text, Transition } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { ParameterTreeNode } from '@/libs/buildParameterTree';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { Parameter } from '@/types/subIngredients/parameter';
import { formatPeriod } from '@/utils/dateUtils';
import { formatLabelParts, getHierarchicalLabelsFromTree } from '@/utils/parameterLabels';
import { formatParameterValue } from '@/utils/policyTableHelpers';
import { FONT_SIZES } from '../../constants';
import { PolicyOverviewContent } from '../policyCreation';

interface PolicyDetailsDrawerProps {
  policy: {
    id: string;
    associationId?: string;
    label: string;
    paramCount: number;
    parameters: Parameter[];
  } | null;
  parameters: Record<string, ParameterMetadata>;
  parameterTree: ParameterTreeNode | null | undefined;
  onClose: () => void;
  onSelect: () => void;
  onEdit?: () => void;
}

export function PolicyDetailsDrawer({
  policy,
  parameters,
  parameterTree,
  onClose,
  onSelect,
  onEdit,
}: PolicyDetailsDrawerProps) {
  const [hoveredParamName, setHoveredParamName] = useState<string | null>(null);

  const modifiedParams = useMemo(() => {
    if (!policy) return [];
    return policy.parameters.map((param) => {
      const hierarchicalLabels = getHierarchicalLabelsFromTree(param.name, parameterTree);
      const displayLabel =
        hierarchicalLabels.length > 0
          ? formatLabelParts(hierarchicalLabels)
          : param.name.split('.').pop() || param.name;
      const metadata = parameters[param.name];
      const changes = (param.values || []).map((interval) => ({
        period: formatPeriod(interval.startDate, interval.endDate),
        value: formatParameterValue(interval.value, metadata?.unit ?? undefined),
      }));
      return { paramName: param.name, label: displayLabel, changes };
    });
  }, [policy, parameters, parameterTree]);

  return (
    <>
      {/* Overlay */}
      <Transition mounted={!!policy} transition="fade" duration={200}>
        {(transitionStyles) => (
          <Box
            style={{
              ...transitionStyles,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.08)',
              zIndex: 10,
            }}
            onClick={onClose}
          />
        )}
      </Transition>

      {/* Drawer */}
      <Transition mounted={!!policy} transition="slide-left" duration={250}>
        {(transitionStyles) => (
          <Box
            style={{
              ...transitionStyles,
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 480,
              background: colors.white,
              borderLeft: `1px solid ${colors.gray[200]}`,
              boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.08)',
              zIndex: 11,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {policy && (
              <>
                <Box style={{ padding: spacing.lg, borderBottom: `1px solid ${colors.gray[200]}` }}>
                  <Group justify="space-between" align="center">
                    <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                      Policy details
                    </Text>
                    <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                      <IconX size={18} />
                    </ActionIcon>
                  </Group>
                </Box>
                <Box
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: spacing.lg,
                    background: colors.gray[50],
                  }}
                >
                  <PolicyOverviewContent
                    policyLabel={policy.label}
                    onLabelChange={() => {}}
                    isReadOnly={true}
                    modificationCount={policy.paramCount}
                    modifiedParams={modifiedParams}
                    hoveredParamName={hoveredParamName}
                    onHoverParam={setHoveredParamName}
                    onClickParam={() => {}}
                  />
                </Box>
                <Box style={{ padding: spacing.lg, borderTop: `1px solid ${colors.gray[200]}` }}>
                  <Stack gap={spacing.sm}>
                    <Button
                      color="teal"
                      fullWidth
                      onClick={onSelect}
                      rightSection={<IconChevronRight size={16} />}
                    >
                      Select this policy
                    </Button>
                    {onEdit && (
                      <Button
                        variant="default"
                        fullWidth
                        onClick={onEdit}
                        leftSection={<IconPencil size={16} />}
                      >
                        Edit policy
                      </Button>
                    )}
                  </Stack>
                </Box>
              </>
            )}
          </Box>
        )}
      </Transition>
    </>
  );
}
