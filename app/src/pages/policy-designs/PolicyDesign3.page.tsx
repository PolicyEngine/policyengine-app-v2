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
import { MOCK_BASELINE_POLICY, MOCK_REFORM_POLICY } from './mockPolicyData';

/**
 * Policy Design 3: Side-by-side comparison view
 *
 * This design shows both Baseline and Reform policies side-by-side
 * in a two-column layout for easy comparison.
 */

/**
 * Component to display a single policy's parameters in column format
 */
function PolicyColumn({ policy, title }: { policy: Policy; title: string }) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  return (
    <Box style={{ flex: 1 }}>
      <Box
        p={spacing.md}
        mb={spacing.md}
        style={{
          backgroundColor: colors.white,
          borderRadius: '8px',
          borderLeft: `3px solid ${colors.primary[500]}`,
          border: `1px solid ${colors.border.light}`,
        }}
      >
        <Text size="xs" c={colors.text.secondary} mb={spacing.xs}>
          {title}
        </Text>
        <Text size="md" fw={typography.fontWeight.semibold}>
          {policy.label || 'Unnamed Policy'}
        </Text>
      </Box>

      <Stack gap={spacing.md}>
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
                  borderRadius: '8px',
                  backgroundColor: colors.white,
                }}
              >
                <Text size="sm" fw={typography.fontWeight.medium} mb={spacing.xs}>
                  {paramLabel}
                </Text>
                <Text size="xs" c={colors.text.secondary} mb={spacing.sm}>
                  {param.name}
                </Text>
                {param.values.map((interval, vidx) => (
                  <Box key={vidx}>
                    <Text size="xs" c={colors.text.secondary} mb={2}>
                      {interval.startDate} - {interval.endDate}
                    </Text>
                    <Text size="lg" fw={typography.fontWeight.bold} c={colors.primary[700]}>
                      {typeof interval.value === 'number'
                        ? unit === '%'
                          ? `${(interval.value * 100).toFixed(1)}%`
                          : unit === 'currency-USD'
                            ? `$${interval.value.toLocaleString()}`
                            : interval.value.toLocaleString()
                        : String(interval.value)}
                    </Text>
                  </Box>
                ))}
              </Box>
            );
          })
        ) : (
          <Text size="sm" c={colors.text.secondary}>
            No parameters modified
          </Text>
        )}
      </Stack>
    </Box>
  );
}

export default function PolicyDesign3Page() {
  const navigate = useNavigate();
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
                Policy Design 3: Side-by-Side Comparison
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
            <Anchor size="sm" underline="always" c={colors.blue[700]}>
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

          {/* Tab Content - Side-by-side comparison */}
          <Box pt={spacing.xl}>
            <Group align="flex-start" gap={spacing.xl} style={{ flexWrap: 'nowrap' }}>
              <PolicyColumn policy={MOCK_BASELINE_POLICY} title="BASELINE POLICY" />
              <Box
                style={{
                  width: '2px',
                  backgroundColor: colors.border.light,
                  alignSelf: 'stretch',
                }}
              />
              <PolicyColumn policy={MOCK_REFORM_POLICY} title="REFORM POLICY" />
            </Group>
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
