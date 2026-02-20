/**
 * Concept 5: Tabbed Detail View
 *
 * Sidebar with parameter tree + tabbed main area (Overview, Edit, History).
 */
import { Fragment, useState } from 'react';
import { IconChartLine, IconEye, IconPencil, IconScale } from '@tabler/icons-react';
import { Box, Button, Group, Paper, SegmentedControl, Stack, Tabs, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '@/pages/reportBuilder/constants';
import { ConceptShell } from './ConceptShell';
import {
  POLICY_COLOR,
  SAMPLE_DISPLAY_PARAMS,
  SAMPLE_POLICY,
  SAMPLE_TREE_ITEMS,
} from './sampleData';

export function Concept5TabbedDetailView() {
  const [activeTab, setActiveTab] = useState<string | null>('overview');

  return (
    <ConceptShell
      number={5}
      title="Tabbed detail view"
      description='Sidebar with parameter tree navigation + tabbed main area. The "Overview" tab shows all parameters at a glance, the "Edit" tab provides the value setter, and the "History" tab shows historical chart data.'
    >
      <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 500 }}>
        {/* Sidebar - static parameter tree */}
        <Box
          style={{
            width: 240,
            borderRight: `1px solid ${colors.border.light}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            style={{
              padding: spacing.md,
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            <Text
              fw={700}
              style={{
                fontSize: 10,
                color: colors.gray[500],
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Parameters
            </Text>
          </Box>
          <Box style={{ flex: 1, padding: spacing.md, overflow: 'auto' }}>
            <StaticTree items={SAMPLE_TREE_ITEMS} />
          </Box>
        </Box>

        {/* Main content */}
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Policy status header */}
          <Box
            style={{
              padding: `${spacing.md} ${spacing.lg}`,
              borderBottom: `1px solid ${colors.border.light}`,
              background: POLICY_COLOR.bg,
            }}
          >
            <Group justify="space-between">
              <Group gap={spacing.sm}>
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: spacing.radius.md,
                    background: `linear-gradient(135deg, ${POLICY_COLOR.bg}, ${colors.white})`,
                    border: `1px solid ${POLICY_COLOR.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconScale size={16} color={POLICY_COLOR.icon} />
                </Box>
                <Stack gap={0}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                    {SAMPLE_POLICY.label}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                    Editing as new policy
                  </Text>
                </Stack>
              </Group>
              <Group gap={spacing.xs}>
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: colors.primary[500],
                  }}
                />
                <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>
                  {SAMPLE_POLICY.paramCount} parameters modified
                </Text>
              </Group>
            </Group>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Tabs.List style={{ borderBottom: `1px solid ${colors.border.light}` }}>
              <Tabs.Tab
                value="overview"
                leftSection={<IconEye size={14} />}
                style={{ fontSize: FONT_SIZES.small }}
              >
                Overview
              </Tabs.Tab>
              <Tabs.Tab
                value="edit"
                leftSection={<IconPencil size={14} />}
                style={{ fontSize: FONT_SIZES.small }}
              >
                Edit
              </Tabs.Tab>
              <Tabs.Tab
                value="history"
                leftSection={<IconChartLine size={14} />}
                style={{ fontSize: FONT_SIZES.small }}
              >
                History
              </Tabs.Tab>
            </Tabs.List>

            {/* Overview tab */}
            <Tabs.Panel value="overview" style={{ flex: 1, overflow: 'auto' }}>
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 0,
                }}
              >
                {/* Headers */}
                <Text
                  fw={600}
                  style={{
                    fontSize: 11,
                    color: colors.gray[500],
                    padding: `${spacing.sm} ${spacing.lg}`,
                    borderBottom: `1px solid ${colors.gray[200]}`,
                    background: colors.gray[50],
                  }}
                >
                  Parameter
                </Text>
                <Text
                  fw={600}
                  style={{
                    fontSize: 11,
                    color: colors.gray[500],
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderBottom: `1px solid ${colors.gray[200]}`,
                    background: colors.gray[50],
                    textAlign: 'right',
                  }}
                >
                  Period
                </Text>
                <Text
                  fw={600}
                  style={{
                    fontSize: 11,
                    color: colors.gray[500],
                    padding: `${spacing.sm} ${spacing.lg}`,
                    borderBottom: `1px solid ${colors.gray[200]}`,
                    background: colors.gray[50],
                    textAlign: 'right',
                  }}
                >
                  Value
                </Text>

                {SAMPLE_DISPLAY_PARAMS.map((param) => (
                  <Fragment key={param.paramName}>
                    <Box
                      style={{
                        padding: `${spacing.sm} ${spacing.lg}`,
                        borderBottom: `1px solid ${colors.gray[100]}`,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: FONT_SIZES.small,
                          color: colors.gray[700],
                          lineHeight: 1.4,
                        }}
                      >
                        {param.label}
                      </Text>
                    </Box>
                    <Box
                      style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        borderBottom: `1px solid ${colors.gray[100]}`,
                        textAlign: 'right',
                      }}
                    >
                      {param.changes.map((c, i) => (
                        <Text
                          key={i}
                          style={{
                            fontSize: FONT_SIZES.small,
                            color: colors.gray[500],
                            lineHeight: 1.4,
                          }}
                        >
                          {c.period}
                        </Text>
                      ))}
                    </Box>
                    <Box
                      style={{
                        padding: `${spacing.sm} ${spacing.lg}`,
                        borderBottom: `1px solid ${colors.gray[100]}`,
                        textAlign: 'right',
                      }}
                    >
                      {param.changes.map((c, i) => (
                        <Text
                          key={i}
                          fw={500}
                          style={{
                            fontSize: FONT_SIZES.small,
                            color: POLICY_COLOR.icon,
                            lineHeight: 1.4,
                          }}
                        >
                          {c.value}
                        </Text>
                      ))}
                    </Box>
                  </Fragment>
                ))}
              </Box>
            </Tabs.Panel>

            {/* Edit tab */}
            <Tabs.Panel value="edit" style={{ flex: 1, overflow: 'auto' }}>
              <Box style={{ padding: spacing.lg, background: colors.gray[50], minHeight: '100%' }}>
                <Stack gap={spacing.md}>
                  {/* Selected parameter card */}
                  <Paper
                    style={{
                      padding: spacing.md,
                      border: `1px solid ${colors.border.light}`,
                      borderRadius: spacing.radius.md,
                    }}
                  >
                    <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>
                      IRS &gt; Income &gt; Bracket rates &gt; Rate 1
                    </Text>
                    <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                      The first marginal income tax bracket rate
                    </Text>
                  </Paper>

                  <Group gap={spacing.lg} align="flex-start" wrap="nowrap">
                    {/* Value setter */}
                    <Paper
                      style={{
                        flex: 1,
                        padding: spacing.lg,
                        border: `1px solid ${colors.border.light}`,
                        borderRadius: spacing.radius.md,
                      }}
                    >
                      <Stack gap={spacing.md}>
                        <Text fw={600} style={{ fontSize: FONT_SIZES.small }}>
                          Set new value
                        </Text>
                        <SegmentedControl
                          size="xs"
                          data={['Default', 'Yearly', 'Date range', 'Multi-year']}
                          value="Default"
                        />
                        <Box
                          style={{
                            padding: spacing.xl,
                            textAlign: 'center',
                            border: `1px dashed ${colors.gray[300]}`,
                            borderRadius: spacing.radius.md,
                          }}
                        >
                          <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
                            Value input component renders here based on parameter type
                          </Text>
                        </Box>
                        <Button color="teal" fullWidth>
                          Add change
                        </Button>
                      </Stack>
                    </Paper>

                    {/* Changes summary */}
                    <Paper
                      style={{
                        flex: 1,
                        padding: spacing.lg,
                        border: `1px solid ${colors.border.light}`,
                        borderRadius: spacing.radius.md,
                      }}
                    >
                      <Group gap={spacing.xs} style={{ marginBottom: spacing.md }}>
                        <Text fw={600} style={{ fontSize: FONT_SIZES.small }}>
                          Changes
                        </Text>
                        <Box
                          style={{
                            background: colors.primary[50],
                            borderRadius: 10,
                            padding: '1px 8px',
                          }}
                        >
                          <Text fw={700} style={{ fontSize: 11, color: colors.primary[700] }}>
                            {SAMPLE_POLICY.paramCount}
                          </Text>
                        </Box>
                      </Group>

                      <Stack gap={spacing.xs}>
                        {SAMPLE_DISPLAY_PARAMS.map((param) => (
                          <Box
                            key={param.paramName}
                            style={{
                              padding: `${spacing.xs} ${spacing.sm}`,
                              background: colors.gray[50],
                              borderRadius: spacing.radius.sm,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                color: colors.gray[600],
                              }}
                            >
                              {param.label}
                            </Text>
                            {param.changes.map((c, i) => (
                              <Text
                                key={i}
                                fw={500}
                                style={{ fontSize: 11, color: POLICY_COLOR.icon }}
                              >
                                {c.period}: {c.value}
                              </Text>
                            ))}
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Group>
                </Stack>
              </Box>
            </Tabs.Panel>

            {/* History tab */}
            <Tabs.Panel value="history" style={{ flex: 1 }}>
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 300,
                  background: colors.gray[50],
                }}
              >
                <Stack align="center" gap={spacing.sm}>
                  <IconChartLine size={40} color={colors.gray[300]} />
                  <Text style={{ fontSize: FONT_SIZES.normal, color: colors.gray[400] }}>
                    Historical values chart
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
                    Shows base vs. reform values over time for the selected parameter
                  </Text>
                </Stack>
              </Box>
            </Tabs.Panel>
          </Tabs>

          {/* Footer */}
          <Box
            style={{
              padding: `${spacing.md} ${spacing.lg}`,
              borderTop: `1px solid ${colors.border.light}`,
            }}
          >
            <Group justify="flex-end">
              <Button color="teal">Save as new policy</Button>
            </Group>
          </Box>
        </Box>
      </Group>
    </ConceptShell>
  );
}

function StaticTree({
  items,
  depth = 0,
}: {
  items: Array<{
    label: string;
    children?: Array<{ label: string; children?: Array<{ label: string }> }>;
  }>;
  depth?: number;
}) {
  return (
    <Stack gap={2}>
      {items.map((item) => (
        <Box key={item.label}>
          <Text
            style={{
              fontSize: 12,
              color: depth === 0 ? colors.gray[700] : colors.gray[600],
              fontWeight: depth === 0 ? 600 : 400,
              padding: `3px ${spacing.xs}`,
              paddingLeft: depth * 12 + 4,
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </Text>
          {item.children && <StaticTree items={item.children} depth={depth + 1} />}
        </Box>
      ))}
    </Stack>
  );
}
