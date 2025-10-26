import {
  IconChevronLeft,
  IconClock,
  IconPencil,
  IconRefresh,
  IconShare,
  IconStack2,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Container,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import {
  MOCK_BASELINE_POLICY,
  MOCK_CURRENT_LAW_POLICY,
  MOCK_REFORM_POLICY,
} from './mockPolicyData';

/**
 * Policy Design 4: Table/List format with Baseline, Reform, and Current Law columns
 *
 * This design shows all parameters in a table format with side-by-side comparison
 * of values across current law, baseline, and reform policies.
 */

// Helper to get parameter value as formatted string
function getParameterValue(policy: Policy, paramName: string, unit: string): string | undefined {
  const param = policy.parameters?.find((p) => p.name === paramName);
  if (!param || !param.values || param.values.length === 0) {
    return undefined;
  }

  const value = param.values[0].value;
  if (typeof value === 'number') {
    if (unit === '%') {
      return `${(value * 100).toFixed(1)}%`;
    } else if (unit === 'currency-USD') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  }
  return String(value);
}

export default function PolicyDesign4Page() {
  const navigate = useNavigate();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const timestamp = 'Ran today at 05:23:41';

  const mainTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'baseline-results', label: 'Baseline Simulation Results' },
    { value: 'reform-results', label: 'Reform Results' },
    { value: 'dynamics', label: 'Dynamics' },
    { value: 'policy', label: 'Policy' },
    { value: 'population', label: 'Population' },
  ];

  const activeTab = 'policy';

  // Collect all unique parameter names across all policies
  const allParamNames = new Set<string>();
  [MOCK_CURRENT_LAW_POLICY, MOCK_BASELINE_POLICY, MOCK_REFORM_POLICY].forEach((policy) => {
    policy.parameters?.forEach((param) => allParamNames.add(param.name));
  });

  const paramList = Array.from(allParamNames);

  return (
    <Container size="xl" px={spacing.xl}>
      <Stack gap={spacing.xl}>
        {/* Back navigation */}
        <Group gap={spacing.xs} align="center">
          <IconChevronLeft size={20} color={colors.text.secondary} />
          <Text
            size="md"
            c={colors.text.secondary}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/us')}
          >
            Reports
          </Text>
        </Group>

        {/* Header Section */}
        <Box>
          {/* Title row with actions */}
          <Group justify="space-between" align="flex-start" mb={spacing.xs}>
            <Group gap={spacing.xs} align="center">
              <Title
                order={1}
                variant="colored"
                fw={typography.fontWeight.semibold}
                fz={typography.fontSize['3xl']}
              >
                Policy Design 4: Table Comparison
              </Title>
              <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Edit report name">
                <IconPencil size={18} />
              </ActionIcon>
            </Group>

            <Group gap={spacing.sm}>
              <Button
                variant="filled"
                leftSection={<IconRefresh size={18} />}
                bg={colors.warning}
                c={colors.black}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: colors.warning,
                      filter: 'brightness(0.95)',
                    },
                  },
                }}
              >
                Run Again
              </Button>
              <Button variant="default" leftSection={<IconShare size={18} />}>
                Share
              </Button>
            </Group>
          </Group>

          {/* Timestamp and View All */}
          <Group gap={spacing.xs} align="center">
            <IconClock size={16} color={colors.text.secondary} />
            <Text size="sm" c="dimmed">
              {timestamp}
            </Text>
            <Anchor size="sm" underline="always" c={colors.primary[700]}>
              View All
            </Anchor>
          </Group>
        </Box>

        {/* Navigation Tabs */}
        <Box
          style={{
            borderTop: `1px solid ${colors.border.light}`,
            paddingTop: spacing.md,
          }}
        >
          <Box
            style={{
              display: 'flex',
              position: 'relative',
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            {mainTabs.map((tab, index) => (
              <Box
                key={tab.value}
                style={{
                  paddingLeft: spacing.sm,
                  paddingRight: spacing.sm,
                  paddingBottom: spacing.xs,
                  paddingTop: spacing.xs,
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  position: 'relative',
                  borderRight:
                    index < mainTabs.length - 1 ? `1px solid ${colors.border.light}` : 'none',
                  marginBottom: '-1px',
                }}
              >
                <Text
                  span
                  variant="tab"
                  style={{
                    color: activeTab === tab.value ? colors.text.primary : colors.gray[700],
                    fontWeight:
                      activeTab === tab.value
                        ? typography.fontWeight.medium
                        : typography.fontWeight.normal,
                  }}
                >
                  {tab.label}
                </Text>
                <IconStack2 size={14} color={colors.gray[500]} />
                {activeTab === tab.value && (
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: colors.warning,
                      zIndex: 1,
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>

          {/* Tab Content - Table Layout */}
          <Box pt={spacing.xl}>
            <Box
              style={{
                border: `1px solid ${colors.border.light}`,
                borderRadius: spacing.radius.lg,
                overflow: 'hidden',
                backgroundColor: colors.white,
              }}
            >
              <Table>
                <Table.Thead style={{ backgroundColor: colors.gray[50] }}>
                  <Table.Tr>
                    <Table.Th
                      style={{
                        width: '45%',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      Parameter
                    </Table.Th>
                    <Table.Th
                      style={{
                        width: '18.33%',
                        textAlign: 'right',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      Current Law
                    </Table.Th>
                    <Table.Th
                      style={{
                        width: '18.33%',
                        textAlign: 'right',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      Baseline
                    </Table.Th>
                    <Table.Th
                      style={{
                        width: '18.33%',
                        textAlign: 'right',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: `${spacing.md} ${spacing.lg}`,
                      }}
                    >
                      Reform
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paramList.map((paramName) => {
                    const metadata: ParameterMetadata | undefined = parameters[paramName];
                    const paramLabel = metadata?.label || paramName;
                    const unit = metadata?.unit || '';

                    const currentLawValue = getParameterValue(
                      MOCK_CURRENT_LAW_POLICY,
                      paramName,
                      unit
                    );
                    const baselineValue = getParameterValue(MOCK_BASELINE_POLICY, paramName, unit);
                    const reformValue = getParameterValue(MOCK_REFORM_POLICY, paramName, unit);

                    // Check if values differ
                    const hasChanges =
                      currentLawValue !== baselineValue ||
                      baselineValue !== reformValue ||
                      currentLawValue !== reformValue;

                    return (
                      <Table.Tr key={paramName}>
                        <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
                          <Box>
                            <Text size="sm" fw={typography.fontWeight.medium}>
                              {paramLabel}
                            </Text>
                            <Text size="xs" c={colors.text.secondary}>
                              {paramName}
                            </Text>
                          </Box>
                        </Table.Td>
                        <Table.Td
                          style={{
                            textAlign: 'right',
                            padding: `${spacing.md} ${spacing.lg}`,
                          }}
                        >
                          <Text
                            size="sm"
                            fw={typography.fontWeight.medium}
                            c={
                              hasChanges && currentLawValue !== baselineValue
                                ? colors.primary[700]
                                : colors.text.primary
                            }
                          >
                            {currentLawValue || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td
                          style={{
                            textAlign: 'right',
                            padding: `${spacing.md} ${spacing.lg}`,
                          }}
                        >
                          <Text
                            size="sm"
                            fw={typography.fontWeight.medium}
                            c={
                              hasChanges && baselineValue !== currentLawValue
                                ? colors.primary[700]
                                : colors.text.primary
                            }
                          >
                            {baselineValue || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td
                          style={{
                            textAlign: 'right',
                            padding: `${spacing.md} ${spacing.lg}`,
                          }}
                        >
                          <Text
                            size="sm"
                            fw={typography.fontWeight.bold}
                            c={
                              hasChanges && reformValue !== baselineValue
                                ? colors.primary[700]
                                : colors.text.primary
                            }
                          >
                            {reformValue || '—'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
