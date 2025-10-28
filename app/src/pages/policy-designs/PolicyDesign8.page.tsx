import { useState } from 'react';
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
 * Policy Design 8: Borderless list format with separate ribbon tabs
 *
 * This design shows parameters in a clean list format (like a table without borders)
 * with separate ribbon-level tabs for Current Law, Baseline, and Reform policies.
 */

/**
 * Component to display parameters in borderless list format
 */
function PolicyParameterList({ policy }: { policy: Policy }) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  return (
    <Stack gap={0}>
      <Box
        p={spacing.md}
        mb={spacing.lg}
        style={{
          backgroundColor: colors.primary[50],
          borderRadius: '8px',
          border: `1px solid ${colors.primary[200]}`,
        }}
      >
        <Text size="xs" c={colors.text.secondary} mb={spacing.xs}>
          POLICY NAME
        </Text>
        <Text size="md" fw={typography.fontWeight.semibold}>
          {policy.label || 'Unnamed Policy'}
        </Text>
      </Box>

      {/* Header row */}
      <Box
        py={spacing.sm}
        px={spacing.md}
        style={{
          borderBottom: `2px solid ${colors.border.light}`,
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" fw={typography.fontWeight.semibold} c={colors.text.secondary}>
            PARAMETER
          </Text>
          <Text
            size="xs"
            fw={typography.fontWeight.semibold}
            c={colors.text.secondary}
            style={{ textAlign: 'right', minWidth: '150px' }}
          >
            VALUE
          </Text>
        </Group>
      </Box>

      {/* Parameter rows */}
      <Stack gap={0}>
        {policy.parameters && policy.parameters.length > 0 ? (
          policy.parameters.map((param, idx) => {
            const metadata: ParameterMetadata | undefined = parameters[param.name];
            const paramLabel = metadata?.label || param.name;
            const unit = metadata?.unit || '';

            return (
              <Box
                key={idx}
                py={spacing.md}
                px={spacing.md}
                style={{
                  borderBottom: `1px solid ${colors.border.light}`,
                  backgroundColor: idx % 2 === 0 ? colors.white : colors.gray[50],
                }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={typography.fontWeight.medium} mb={4}>
                      {paramLabel}
                    </Text>
                    <Text size="xs" c={colors.text.secondary}>
                      {param.name}
                    </Text>
                  </Box>
                  <Box style={{ textAlign: 'right', minWidth: '150px' }}>
                    {param.values.map((interval, vidx) => (
                      <Box key={vidx}>
                        <Text size="lg" fw={typography.fontWeight.bold} c={colors.primary[700]}>
                          {typeof interval.value === 'number'
                            ? unit === '%'
                              ? `${(interval.value * 100).toFixed(1)}%`
                              : unit === 'currency-USD'
                                ? `$${interval.value.toLocaleString()}`
                                : interval.value.toLocaleString()
                            : String(interval.value)}
                        </Text>
                        <Text size="xs" c={colors.text.secondary}>
                          {interval.startDate.split('-')[0]} - {interval.endDate.split('-')[0]}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                </Group>
              </Box>
            );
          })
        ) : (
          <Box py={spacing.md} px={spacing.md}>
            <Text size="sm" c={colors.text.secondary}>
              No parameters modified
            </Text>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}

export default function PolicyDesign8Page() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('current-law');
  const timestamp = 'Ran today at 05:23:41';

  // Note: In this design, we have separate ribbon tabs for each policy type
  const mainTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'baseline-results', label: 'Baseline Simulation Results' },
    { value: 'reform-results', label: 'Reform Results' },
    { value: 'dynamics', label: 'Dynamics' },
    { value: 'current-law', label: 'Current Law' },
    { value: 'baseline-policy', label: 'Baseline Policy' },
    { value: 'reform-policy', label: 'Reform Policy' },
    { value: 'population', label: 'Population' },
  ];

  const handleTabClick = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  const getPolicyByTab = (tab: string): Policy | null => {
    switch (tab) {
      case 'current-law':
        return MOCK_CURRENT_LAW_POLICY;
      case 'baseline-policy':
        return MOCK_BASELINE_POLICY;
      case 'reform-policy':
        return MOCK_REFORM_POLICY;
      default:
        return null;
    }
  };

  const currentPolicy = getPolicyByTab(activeTab);

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
                Policy Design 8: Borderless List with Ribbon Tabs
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

        {/* Navigation Tabs (Ribbon) */}
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
              overflowX: 'auto',
            }}
          >
            {mainTabs.map((tab, index) => (
              <Box
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
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
                  whiteSpace: 'nowrap',
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

          {/* Tab Content */}
          <Box pt={spacing.xl}>
            {currentPolicy ? (
              <PolicyParameterList policy={currentPolicy} />
            ) : (
              <Text size="sm" c={colors.text.secondary}>
                Content for {activeTab} tab
              </Text>
            )}
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
