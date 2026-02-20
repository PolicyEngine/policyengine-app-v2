/**
 * PolicyDetailsDrawer - Sliding panel showing policy parameter details
 */
import { Fragment } from 'react';
import { IconChevronRight, IconPencil, IconX } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  Transition,
} from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { ParameterTreeNode } from '@/libs/buildParameterTree';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { Parameter } from '@/types/subIngredients/parameter';
import { formatPeriod } from '@/utils/dateUtils';
import { formatLabelParts, getHierarchicalLabelsFromTree } from '@/utils/parameterLabels';
import { formatParameterValue } from '@/utils/policyTableHelpers';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';

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
  const colorConfig = INGREDIENT_COLORS.policy;

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
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={spacing.xs} style={{ flex: 1 }}>
                      <Text
                        fw={600}
                        style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}
                      >
                        {policy.label}
                      </Text>
                      <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                        {policy.paramCount} parameter{policy.paramCount !== 1 ? 's' : ''} changed
                        from current law
                      </Text>
                    </Stack>
                    <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                      <IconX size={18} />
                    </ActionIcon>
                  </Group>
                </Box>
                <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                    <Box
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: '0',
                      }}
                    >
                      <Text
                        fw={600}
                        style={{
                          fontSize: FONT_SIZES.small,
                          color: colors.gray[600],
                          padding: spacing.lg,
                          paddingBottom: spacing.sm,
                          borderBottom: `1px solid ${colors.gray[200]}`,
                        }}
                      >
                        Parameter
                      </Text>
                      <Text
                        fw={600}
                        style={{
                          fontSize: FONT_SIZES.small,
                          color: colors.gray[600],
                          textAlign: 'right',
                          padding: spacing.lg,
                          paddingBottom: spacing.sm,
                          borderBottom: `1px solid ${colors.gray[200]}`,
                          gridColumn: 'span 2',
                        }}
                      >
                        Changes
                      </Text>
                      {(() => {
                        const groupedParams: Array<{
                          paramName: string;
                          label: string;
                          changes: Array<{ period: string; value: string }>;
                        }> = [];
                        policy.parameters.forEach((param) => {
                          const paramName = param.name;
                          const hierarchicalLabels = getHierarchicalLabelsFromTree(
                            paramName,
                            parameterTree
                          );
                          const displayLabel =
                            hierarchicalLabels.length > 0
                              ? formatLabelParts(hierarchicalLabels)
                              : paramName.split('.').pop() || paramName;
                          const metadata = parameters[paramName];
                          const changes = (param.values || []).map((interval) => ({
                            period: formatPeriod(interval.startDate, interval.endDate),
                            value: formatParameterValue(
                              interval.value,
                              metadata?.unit ?? undefined
                            ),
                          }));
                          groupedParams.push({ paramName, label: displayLabel, changes });
                        });
                        return groupedParams.map((param) => (
                          <Fragment key={param.paramName}>
                            <Box
                              style={{
                                padding: `${spacing.sm} ${spacing.lg}`,
                                borderBottom: `1px solid ${colors.gray[100]}`,
                              }}
                            >
                              <Tooltip label={param.paramName} multiline w={300} withArrow>
                                <Text
                                  style={{
                                    fontSize: FONT_SIZES.small,
                                    color: colors.gray[700],
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {param.label}
                                </Text>
                              </Tooltip>
                            </Box>
                            <Box
                              style={{
                                padding: `${spacing.sm} ${spacing.md}`,
                                borderBottom: `1px solid ${colors.gray[100]}`,
                                textAlign: 'right',
                              }}
                            >
                              {param.changes.map((change, idx) => (
                                <Text
                                  key={idx}
                                  style={{
                                    fontSize: FONT_SIZES.small,
                                    color: colors.gray[500],
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {change.period}
                                </Text>
                              ))}
                            </Box>
                            <Box
                              style={{
                                padding: `${spacing.sm} ${spacing.lg}`,
                                paddingLeft: spacing.sm,
                                borderBottom: `1px solid ${colors.gray[100]}`,
                                textAlign: 'right',
                              }}
                            >
                              {param.changes.map((change, idx) => (
                                <Text
                                  key={idx}
                                  fw={500}
                                  style={{
                                    fontSize: FONT_SIZES.small,
                                    color: colorConfig.icon,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {change.value}
                                </Text>
                              ))}
                            </Box>
                          </Fragment>
                        ));
                      })()}
                    </Box>
                  </ScrollArea>
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
