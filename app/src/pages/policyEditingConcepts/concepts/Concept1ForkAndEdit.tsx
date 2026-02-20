/**
 * Concept 1: Fork & Edit
 *
 * Browse grid with a "Fork" icon on each policy card.
 * Clicking fork transitions to creation mode pre-populated with that policy's parameters.
 */
import { useState } from 'react';
import { IconChevronLeft, IconChevronRight, IconGitFork, IconScale } from '@tabler/icons-react';
import { Box, Button, Group, Paper, Stack, Text, Transition } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '@/pages/reportBuilder/constants';
import { ConceptShell } from './ConceptShell';
import {
  POLICY_COLOR,
  SAMPLE_DISPLAY_PARAMS,
  SAMPLE_SAVED_POLICIES,
  type SamplePolicy,
} from './sampleData';

export function Concept1ForkAndEdit() {
  const [editingPolicy, setEditingPolicy] = useState<SamplePolicy | null>(null);

  return (
    <ConceptShell
      number={1}
      title="Fork & edit"
      description={`Browse policies in a grid. Each card has a "Fork & edit" action that opens creation mode pre-populated with that policy's parameters. The user sees all existing changes and can modify them before saving as a new policy.`}
    >
      <Box style={{ position: 'relative', minHeight: 500 }}>
        {/* Browse grid view */}
        <Transition mounted={!editingPolicy} transition="fade" duration={200}>
          {(styles) => (
            <Box style={{ ...styles, padding: spacing.lg }}>
              <Stack gap={spacing.lg}>
                <Group gap={spacing.sm}>
                  <IconScale size={18} color={POLICY_COLOR.icon} />
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
                    Select a policy to fork
                  </Text>
                </Group>

                {/* Current law card */}
                <Paper
                  style={{
                    border: `1px solid ${colors.gray[200]}`,
                    borderRadius: spacing.radius.lg,
                    padding: spacing.lg,
                    position: 'relative',
                    overflow: 'hidden',
                    maxWidth: 340,
                  }}
                >
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: `linear-gradient(90deg, ${POLICY_COLOR.accent}, ${POLICY_COLOR.icon})`,
                    }}
                  />
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={spacing.xs} style={{ flex: 1 }}>
                      <Text
                        fw={600}
                        style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}
                      >
                        Current law
                      </Text>
                      <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                        No parameter changes
                      </Text>
                    </Stack>
                    <IconChevronRight size={16} color={colors.gray[400]} />
                  </Group>
                </Paper>

                {/* Policy cards grid */}
                <Box
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: spacing.md,
                  }}
                >
                  {SAMPLE_SAVED_POLICIES.map((policy) => (
                    <PolicyCardWithFork
                      key={policy.id}
                      policy={policy}
                      onFork={() => setEditingPolicy(policy)}
                    />
                  ))}
                </Box>
              </Stack>
            </Box>
          )}
        </Transition>

        {/* Edit view */}
        <Transition mounted={!!editingPolicy} transition="slide-up" duration={250}>
          {(styles) => (
            <Box style={{ ...styles }}>
              {editingPolicy && (
                <Stack gap={0}>
                  {/* Status header */}
                  <Box
                    style={{
                      padding: `${spacing.md} ${spacing.lg}`,
                      background: POLICY_COLOR.bg,
                      borderBottom: `1px solid ${POLICY_COLOR.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
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
                        <Text
                          fw={600}
                          style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}
                        >
                          {editingPolicy.label}
                        </Text>
                        <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                          Forked — editing as new policy
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
                        {editingPolicy.paramCount} parameter
                        {editingPolicy.paramCount !== 1 ? 's' : ''} modified
                      </Text>
                    </Group>
                  </Box>

                  {/* Parameter changes list */}
                  <Box style={{ padding: spacing.lg }}>
                    <Stack gap={spacing.md}>
                      <Text
                        fw={600}
                        style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}
                      >
                        Pre-populated changes
                      </Text>

                      {SAMPLE_DISPLAY_PARAMS.map((param) => (
                        <Box
                          key={param.paramName}
                          style={{
                            padding: spacing.md,
                            background: colors.gray[50],
                            borderRadius: spacing.radius.md,
                            border: `1px solid ${colors.gray[200]}`,
                          }}
                        >
                          <Group justify="space-between" align="flex-start" wrap="nowrap">
                            <Stack gap={2} style={{ flex: 1 }}>
                              <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[700] }}>
                                {param.label}
                              </Text>
                              {param.changes.map((change, idx) => (
                                <Text
                                  key={idx}
                                  style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}
                                >
                                  {change.period}
                                </Text>
                              ))}
                            </Stack>
                            <Stack gap={2} align="flex-end">
                              <Text
                                style={{
                                  fontSize: FONT_SIZES.small,
                                  color: colors.gray[400],
                                  textDecoration: 'line-through',
                                }}
                              >
                                {param.defaultValue}
                              </Text>
                              {param.changes.map((change, idx) => (
                                <Text
                                  key={idx}
                                  fw={600}
                                  style={{ fontSize: FONT_SIZES.small, color: POLICY_COLOR.icon }}
                                >
                                  {change.value}
                                </Text>
                              ))}
                            </Stack>
                          </Group>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  {/* Footer */}
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
                        onClick={() => setEditingPolicy(null)}
                      >
                        Back to browse
                      </Button>
                      <Button color="teal">Save as new policy</Button>
                    </Group>
                  </Box>
                </Stack>
              )}
            </Box>
          )}
        </Transition>
      </Box>
    </ConceptShell>
  );
}

function PolicyCardWithFork({ policy, onFork }: { policy: SamplePolicy; onFork: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Paper
      style={{
        border: `1px solid ${colors.gray[200]}`,
        borderRadius: spacing.radius.lg,
        padding: spacing.lg,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
        borderColor: hovered ? POLICY_COLOR.border : colors.gray[200],
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: hovered
            ? `linear-gradient(90deg, ${POLICY_COLOR.accent}, ${POLICY_COLOR.icon})`
            : colors.gray[200],
          transition: 'background 0.15s ease',
        }}
      />
      <Group justify="space-between" align="center" wrap="nowrap">
        <Stack gap={spacing.xs} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
            {policy.label}
          </Text>
          <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
            {policy.paramCount} param{policy.paramCount !== 1 ? 's' : ''} changed
          </Text>
        </Stack>
        <Transition mounted={hovered} transition="fade" duration={150}>
          {(styles) => (
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconGitFork size={14} />}
              style={styles}
              onClick={(e) => {
                e.stopPropagation();
                onFork();
              }}
            >
              Fork & edit
            </Button>
          )}
        </Transition>
      </Group>
    </Paper>
  );
}
