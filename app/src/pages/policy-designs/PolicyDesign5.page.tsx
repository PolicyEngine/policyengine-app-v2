import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconChevronLeft,
  IconClock,
  IconPencil,
  IconRefresh,
  IconShare,
  IconStack2,
} from '@tabler/icons-react';
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
import { useSelector } from 'react-redux';
import { CURRENT_YEAR } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { MOCK_BASELINE_POLICY, MOCK_REFORM_POLICY, MOCK_CURRENT_LAW_POLICY } from './mockPolicyData';

/**
 * Policy Design 5: List format with left-hand tabs
 *
 * This design shows parameters in a list format with left-hand tabs
 * to switch between Current Law, Baseline, and Reform policies.
 */

type PolicyType = 'current-law' | 'baseline' | 'reform';

/**
 * Component to display parameters in list format
 */
function PolicyParameterList({ policy }: { policy: Policy }) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  return (
    <Stack gap={spacing.md}>
      <Box
        p={spacing.md}
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

      <Stack gap={spacing.xs}>
        {policy.parameters && policy.parameters.length > 0 ? (
          policy.parameters.map((param, idx) => {
            const metadata: ParameterMetadata | undefined = parameters[param.name];
            const paramLabel = metadata?.label || param.name;
            const unit = metadata?.unit || '';

            return (
              <Box
                key={idx}
                p={spacing.md}
                style={{
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: '6px',
                  backgroundColor: colors.white,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box style={{ flex: 1 }}>
                  <Text size="sm" fw={typography.fontWeight.medium} mb={4}>
                    {paramLabel}
                  </Text>
                  <Text size="xs" c={colors.text.secondary}>
                    {param.name}
                  </Text>
                </Box>
                <Box style={{ textAlign: 'right' }}>
                  {param.values.map((interval, vidx) => (
                    <Box key={vidx}>
                      <Text size="xl" fw={typography.fontWeight.bold} c={colors.primary[700]}>
                        {typeof interval.value === 'number'
                          ? unit === '%'
                            ? `${(interval.value * 100).toFixed(1)}%`
                            : unit === 'currency-USD'
                              ? `$${interval.value.toLocaleString()}`
                              : interval.value.toLocaleString()
                          : String(interval.value)}
                      </Text>
                      <Text size="xs" c={colors.text.secondary}>
                        {interval.startDate} - {interval.endDate}
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })
        ) : (
          <Text size="sm" c={colors.text.secondary}>
            No parameters modified
          </Text>
        )}
      </Stack>
    </Stack>
  );
}

export default function PolicyDesign5Page() {
  const navigate = useNavigate();
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyType>('current-law');
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

  const policyTabs = [
    { value: 'current-law' as PolicyType, label: 'Current Law' },
    { value: 'baseline' as PolicyType, label: 'Baseline Policy' },
    { value: 'reform' as PolicyType, label: 'Reform Policy' },
  ];

  const getPolicyByType = (type: PolicyType): Policy => {
    switch (type) {
      case 'current-law':
        return MOCK_CURRENT_LAW_POLICY;
      case 'baseline':
        return MOCK_BASELINE_POLICY;
      case 'reform':
        return MOCK_REFORM_POLICY;
    }
  };

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
                Policy Design 5: List with Left Tabs
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

          {/* Tab Content - Split Layout */}
          <Box pt={spacing.xl}>
            <Group align="flex-start" gap={spacing.xl} style={{ flexWrap: 'nowrap' }}>
              {/* Left sidebar with policy tabs */}
              <Box
                style={{
                  minWidth: '240px',
                  paddingRight: spacing.lg,
                }}
              >
                <Stack gap={4}>
                  {policyTabs.map((tab) => (
                    <Box
                      key={tab.value}
                      onClick={() => setActivePolicyTab(tab.value)}
                      py={spacing.sm}
                      px={spacing.md}
                      style={{
                        cursor: 'pointer',
                        backgroundColor:
                          activePolicyTab === tab.value ? colors.primary[50] : 'transparent',
                        borderLeft:
                          activePolicyTab === tab.value
                            ? `3px solid ${colors.primary[500]}`
                            : '3px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Text
                        size="sm"
                        fw={
                          activePolicyTab === tab.value
                            ? typography.fontWeight.medium
                            : typography.fontWeight.normal
                        }
                        c={activePolicyTab === tab.value ? colors.text.primary : colors.text.secondary}
                      >
                        {tab.label}
                      </Text>
                    </Box>
                  ))}
                </Stack>

                {/* Subtle note about tab styling */}
                <Box mt={spacing.lg}>
                  <Text size="xs" c={colors.text.secondary} style={{ fontStyle: 'italic' }}>
                    Tab background uses teal (colors.primary[50])
                  </Text>
                </Box>
              </Box>

              {/* Right content area */}
              <Box style={{ flex: 1 }}>
                <PolicyParameterList policy={getPolicyByType(activePolicyTab)} />
              </Box>
            </Group>
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
