/**
 * Concept 3: Split-Pane Comparison
 *
 * Side-by-side: original policy (read-only) vs. modified version with diff indicators.
 */
import { Fragment, useState } from 'react';
import { IconArrowRight, IconScale } from '@tabler/icons-react';
import { Box, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '@/pages/reportBuilder/constants';
import { ConceptShell } from './ConceptShell';
import { POLICY_COLOR, SAMPLE_DISPLAY_PARAMS, SAMPLE_POLICY } from './sampleData';

export function Concept3SplitPaneComparison() {
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const modifiedCount = Object.keys(editedValues).length;

  return (
    <ConceptShell
      number={3}
      title="Split-pane comparison"
      description="Side-by-side view showing the original policy (read-only) on the left and an editable version on the right. Modified values show a diff indicator — strikethrough on the original, teal on the new value."
    >
      <Stack gap={0}>
        {/* Top bar with policy name + diff count */}
        <Box
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            borderBottom: `1px solid ${colors.border.light}`,
            background: POLICY_COLOR.bg,
          }}
        >
          <Group justify="space-between">
            <Group gap={spacing.sm}>
              <IconScale size={18} color={POLICY_COLOR.icon} />
              <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                {SAMPLE_POLICY.label}
              </Text>
            </Group>
            <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
              {modifiedCount > 0
                ? `${modifiedCount} of ${SAMPLE_DISPLAY_PARAMS.length} parameters modified`
                : 'No modifications yet — edit values on the right'}
            </Text>
          </Group>
        </Box>

        {/* Split panes */}
        <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 400 }}>
          {/* Left pane: Original (read-only) */}
          <Box style={{ flex: 1, borderRight: `1px solid ${colors.border.light}` }}>
            <Box
              style={{
                padding: `${spacing.sm} ${spacing.lg}`,
                borderBottom: `1px solid ${colors.gray[200]}`,
                background: colors.gray[50],
              }}
            >
              <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>
                Original
              </Text>
            </Box>

            <Box style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 0 }}>
              {/* Column headers */}
              <Text
                fw={600}
                style={{
                  fontSize: 11,
                  color: colors.gray[500],
                  padding: `${spacing.xs} ${spacing.lg}`,
                  borderBottom: `1px solid ${colors.gray[200]}`,
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
                  padding: `${spacing.xs} ${spacing.lg}`,
                  borderBottom: `1px solid ${colors.gray[200]}`,
                  textAlign: 'right',
                }}
              >
                Value
              </Text>

              {SAMPLE_DISPLAY_PARAMS.map((param) => {
                const isModified = editedValues[param.paramName] !== undefined;
                return (
                  <Fragment key={param.paramName}>
                    <Box
                      style={{
                        padding: `${spacing.sm} ${spacing.lg}`,
                        borderBottom: `1px solid ${colors.gray[100]}`,
                        background: isModified ? '#fef2f2' : 'transparent',
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
                        background: isModified ? '#fef2f2' : 'transparent',
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
                        background: isModified ? '#fef2f2' : 'transparent',
                      }}
                    >
                      {param.changes.map((c, i) => (
                        <Text
                          key={i}
                          fw={500}
                          style={{
                            fontSize: FONT_SIZES.small,
                            color: isModified ? colors.gray[400] : POLICY_COLOR.icon,
                            textDecoration: isModified ? 'line-through' : 'none',
                            lineHeight: 1.4,
                          }}
                        >
                          {c.value}
                        </Text>
                      ))}
                    </Box>
                  </Fragment>
                );
              })}
            </Box>
          </Box>

          {/* Divider with arrow */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              background: colors.gray[50],
            }}
          >
            <IconArrowRight size={14} color={colors.gray[400]} />
          </Box>

          {/* Right pane: Modified (editable) */}
          <Box style={{ flex: 1 }}>
            <Box
              style={{
                padding: `${spacing.sm} ${spacing.lg}`,
                borderBottom: `1px solid ${colors.gray[200]}`,
                background: `${POLICY_COLOR.bg}`,
              }}
            >
              <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: POLICY_COLOR.icon }}>
                Modified
              </Text>
            </Box>

            <Box style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 0 }}>
              {/* Column headers */}
              <Text
                fw={600}
                style={{
                  fontSize: 11,
                  color: colors.gray[500],
                  padding: `${spacing.xs} ${spacing.lg}`,
                  borderBottom: `1px solid ${colors.gray[200]}`,
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
                  padding: `${spacing.xs} ${spacing.lg}`,
                  borderBottom: `1px solid ${colors.gray[200]}`,
                  textAlign: 'right',
                }}
              >
                Value
              </Text>

              {SAMPLE_DISPLAY_PARAMS.map((param) => {
                const isModified = editedValues[param.paramName] !== undefined;
                return (
                  <Fragment key={param.paramName}>
                    <Box
                      style={{
                        padding: `${spacing.sm} ${spacing.lg}`,
                        borderBottom: `1px solid ${colors.gray[100]}`,
                        background: isModified ? `${colors.primary[50]}66` : 'transparent',
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
                        background: isModified ? `${colors.primary[50]}66` : 'transparent',
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
                        background: isModified ? `${colors.primary[50]}66` : 'transparent',
                      }}
                    >
                      <TextInput
                        size="xs"
                        variant="unstyled"
                        value={editedValues[param.paramName] ?? param.changes[0]?.value ?? ''}
                        onChange={(e) =>
                          setEditedValues((prev) => ({
                            ...prev,
                            [param.paramName]: e.currentTarget.value,
                          }))
                        }
                        styles={{
                          input: {
                            textAlign: 'right',
                            fontSize: FONT_SIZES.small,
                            fontWeight: 500,
                            color: isModified ? colors.primary[700] : POLICY_COLOR.icon,
                            padding: 0,
                            height: 'auto',
                            minHeight: 'auto',
                          },
                        }}
                      />
                    </Box>
                  </Fragment>
                );
              })}
            </Box>
          </Box>
        </Group>

        {/* Footer */}
        {modifiedCount > 0 && (
          <Box
            style={{
              padding: `${spacing.md} ${spacing.lg}`,
              borderTop: `1px solid ${colors.border.light}`,
            }}
          >
            <Group justify="space-between">
              <Button variant="subtle" color="gray" onClick={() => setEditedValues({})}>
                Reset all
              </Button>
              <Button color="teal">Save as new policy</Button>
            </Group>
          </Box>
        )}
      </Stack>
    </ConceptShell>
  );
}
