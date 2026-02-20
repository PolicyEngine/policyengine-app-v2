/**
 * Concept 4: Duplicate with Summary Overlay
 *
 * Three states: browse → summary overlay → editor.
 * The summary gives users orientation before diving into editing.
 */
import { Fragment, useState } from 'react';
import { IconChevronLeft, IconChevronRight, IconCopy, IconScale } from '@tabler/icons-react';
import {
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Transition,
} from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '@/pages/reportBuilder/constants';
import { ConceptShell } from './ConceptShell';
import {
  POLICY_COLOR,
  SAMPLE_DISPLAY_PARAMS,
  SAMPLE_SAVED_POLICIES,
  SAMPLE_TREE_ITEMS,
  type SamplePolicy,
} from './sampleData';

type ViewState = 'browse' | 'summary' | 'editor';

export function Concept4DuplicateSummary() {
  const [view, setView] = useState<ViewState>('browse');
  const [selectedPolicy, setSelectedPolicy] = useState<SamplePolicy | null>(null);

  const handleDuplicate = (policy: SamplePolicy) => {
    setSelectedPolicy(policy);
    setView('summary');
  };

  return (
    <ConceptShell
      number={4}
      title="Duplicate with summary"
      description="Three-step flow: browse policies → see a full summary of all parameters → start editing. The summary overlay acts as an orientation step so users understand the full scope of the policy before editing."
    >
      <Box style={{ position: 'relative', minHeight: 500 }}>
        {/* State 1: Browse */}
        <Transition mounted={view === 'browse'} transition="fade" duration={200}>
          {(styles) => (
            <Box style={{ ...styles, padding: spacing.lg }}>
              <Stack gap={spacing.lg}>
                <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
                  Choose a policy to duplicate and edit
                </Text>

                <Box
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: spacing.md,
                  }}
                >
                  {SAMPLE_SAVED_POLICIES.map((policy) => (
                    <Paper
                      key={policy.id}
                      style={{
                        border: `1px solid ${colors.gray[200]}`,
                        borderRadius: spacing.radius.lg,
                        padding: spacing.lg,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onClick={() => handleDuplicate(policy)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = POLICY_COLOR.border;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.gray[200];
                      }}
                    >
                      <Box
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          background: colors.gray[200],
                        }}
                      />
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Stack gap={spacing.xs} style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            fw={600}
                            style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}
                          >
                            {policy.label}
                          </Text>
                          <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                            {policy.paramCount} param{policy.paramCount !== 1 ? 's' : ''} changed
                          </Text>
                        </Stack>
                        <Group gap={4}>
                          <IconCopy size={14} color={colors.gray[400]} />
                          <IconChevronRight size={14} color={colors.gray[400]} />
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Box>
              </Stack>
            </Box>
          )}
        </Transition>

        {/* State 2: Summary overlay */}
        <Transition mounted={view === 'summary'} transition="fade" duration={200}>
          {(styles) => (
            <Box style={{ ...styles }}>
              {selectedPolicy && (
                <Stack gap={0}>
                  {/* Large header */}
                  <Box
                    style={{
                      padding: `${spacing.xl} ${spacing.lg}`,
                      background: `linear-gradient(135deg, ${POLICY_COLOR.bg}, ${colors.white})`,
                      borderBottom: `1px solid ${POLICY_COLOR.border}`,
                    }}
                  >
                    <Stack gap={spacing.sm} align="center">
                      <Box
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: spacing.radius.lg,
                          background: colors.white,
                          border: `1px solid ${POLICY_COLOR.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconScale size={24} color={POLICY_COLOR.icon} />
                      </Box>
                      <Text
                        fw={700}
                        style={{ fontSize: 18, color: colors.gray[900], textAlign: 'center' }}
                      >
                        {selectedPolicy.label}
                      </Text>
                      <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                        {selectedPolicy.paramCount} parameter changes from current law
                      </Text>
                    </Stack>
                  </Box>

                  {/* Full parameter table */}
                  <Box style={{ padding: spacing.lg }}>
                    <Text
                      fw={600}
                      style={{
                        fontSize: FONT_SIZES.small,
                        color: colors.gray[600],
                        marginBottom: spacing.md,
                      }}
                    >
                      All parameter changes
                    </Text>

                    <Box
                      style={{
                        border: `1px solid ${colors.gray[200]}`,
                        borderRadius: spacing.radius.md,
                        overflow: 'hidden',
                      }}
                    >
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
                            padding: `${spacing.xs} ${spacing.md}`,
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
                            padding: `${spacing.xs} ${spacing.md}`,
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
                            padding: `${spacing.xs} ${spacing.md}`,
                            borderBottom: `1px solid ${colors.gray[200]}`,
                            background: colors.gray[50],
                            textAlign: 'right',
                          }}
                        >
                          New value
                        </Text>

                        {SAMPLE_DISPLAY_PARAMS.map((param) => (
                          <Fragment key={param.paramName}>
                            <Box
                              style={{
                                padding: `${spacing.sm} ${spacing.md}`,
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
                                padding: `${spacing.sm} ${spacing.md}`,
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
                    </Box>
                  </Box>

                  {/* Action buttons */}
                  <Box
                    style={{
                      padding: `${spacing.md} ${spacing.lg}`,
                      borderTop: `1px solid ${colors.border.light}`,
                    }}
                  >
                    <Group justify="space-between">
                      <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IconChevronLeft size={16} />}
                        onClick={() => setView('browse')}
                      >
                        Back
                      </Button>
                      <Button color="teal" onClick={() => setView('editor')}>
                        Start editing
                      </Button>
                    </Group>
                  </Box>
                </Stack>
              )}
            </Box>
          )}
        </Transition>

        {/* State 3: Editor mockup */}
        <Transition mounted={view === 'editor'} transition="fade" duration={200}>
          {(styles) => (
            <Box style={{ ...styles }}>
              {selectedPolicy && (
                <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 450 }}>
                  {/* Sidebar - static parameter tree */}
                  <Box
                    style={{
                      width: 240,
                      borderRight: `1px solid ${colors.border.light}`,
                      padding: spacing.md,
                      background: colors.gray[50],
                    }}
                  >
                    <Text
                      fw={700}
                      style={{
                        fontSize: 10,
                        color: colors.gray[500],
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: spacing.md,
                      }}
                    >
                      Parameters
                    </Text>
                    <StaticTree items={SAMPLE_TREE_ITEMS} />
                  </Box>

                  {/* Main content - value setter mockup */}
                  <Box style={{ flex: 1, padding: spacing.lg, background: colors.gray[50] }}>
                    <Stack gap={spacing.md}>
                      {/* Selected param header */}
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

                      {/* Value setter mockup */}
                      <Paper
                        style={{
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
                          <Text
                            style={{
                              fontSize: FONT_SIZES.small,
                              color: colors.gray[500],
                              textAlign: 'center',
                              padding: spacing.xl,
                            }}
                          >
                            Value setter input would appear here
                          </Text>
                          <Button color="teal" fullWidth>
                            Add change
                          </Button>
                        </Stack>
                      </Paper>
                    </Stack>
                  </Box>

                  {/* Footer overlay */}
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: `${spacing.md} ${spacing.lg}`,
                      borderTop: `1px solid ${colors.border.light}`,
                      background: colors.white,
                    }}
                  >
                    <Group justify="space-between">
                      <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IconChevronLeft size={16} />}
                        onClick={() => setView('summary')}
                      >
                        Back to summary
                      </Button>
                      <Button color="teal">Save as new policy</Button>
                    </Group>
                  </Box>
                </Group>
              )}
            </Box>
          )}
        </Transition>
      </Box>
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
              color: colors.gray[depth === 0 ? 700 : 600],
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
