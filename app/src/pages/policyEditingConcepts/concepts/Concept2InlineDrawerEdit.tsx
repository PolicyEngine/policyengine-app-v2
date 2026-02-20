/**
 * Concept 2: Inline Drawer Edit
 *
 * Policy grid on the left, persistent detail panel on the right.
 * Each parameter row has an edit button. Clicking reveals an inline input.
 */
import { useState } from 'react';
import { IconCheck, IconPencil, IconX } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '@/pages/reportBuilder/constants';
import { ConceptShell } from './ConceptShell';
import {
  POLICY_COLOR,
  SAMPLE_DISPLAY_PARAMS,
  SAMPLE_SAVED_POLICIES,
  type DisplayParam,
  type SamplePolicy,
} from './sampleData';

export function Concept2InlineDrawerEdit() {
  const [selectedPolicy, setSelectedPolicy] = useState<SamplePolicy | null>(
    SAMPLE_SAVED_POLICIES[0]
  );
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const hasEdits = Object.keys(editedValues).length > 0;

  return (
    <ConceptShell
      number={2}
      title="Inline drawer edit"
      description="A persistent detail panel shows all parameter changes for the selected policy. Each row has an edit icon — clicking it reveals an inline input to modify the value. Modified rows show the diff."
    >
      <Group align="stretch" gap={0} wrap="nowrap" style={{ minHeight: 500 }}>
        {/* Left: Policy grid */}
        <Box
          style={{
            width: 300,
            borderRight: `1px solid ${colors.border.light}`,
            padding: spacing.lg,
            flexShrink: 0,
          }}
        >
          <Stack gap={spacing.md}>
            <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>
              Your policies
            </Text>
            {SAMPLE_SAVED_POLICIES.map((policy) => (
              <Paper
                key={policy.id}
                style={{
                  border: `1px solid ${selectedPolicy?.id === policy.id ? POLICY_COLOR.border : colors.gray[200]}`,
                  borderRadius: spacing.radius.md,
                  padding: spacing.md,
                  cursor: 'pointer',
                  background: selectedPolicy?.id === policy.id ? POLICY_COLOR.bg : colors.white,
                  transition: 'all 0.15s ease',
                }}
                onClick={() => {
                  setSelectedPolicy(policy);
                  setEditingParam(null);
                  setEditedValues({});
                }}
              >
                <Text fw={600} style={{ fontSize: FONT_SIZES.small, color: colors.gray[900] }}>
                  {policy.label}
                </Text>
                <Text style={{ fontSize: 11, color: colors.gray[500] }}>
                  {policy.paramCount} param{policy.paramCount !== 1 ? 's' : ''} changed
                </Text>
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Right: Detail panel with inline editing */}
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedPolicy ? (
            <>
              {/* Header */}
              <Box
                style={{
                  padding: spacing.lg,
                  borderBottom: `1px solid ${colors.gray[200]}`,
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <Stack gap={spacing.xs}>
                    <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}>
                      {selectedPolicy.label}
                    </Text>
                    <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[500] }}>
                      {selectedPolicy.paramCount} parameter
                      {selectedPolicy.paramCount !== 1 ? 's' : ''} changed from current law
                      {hasEdits && (
                        <Text
                          component="span"
                          style={{ color: colors.primary[600], fontWeight: 600 }}
                        >
                          {' '}
                          ({Object.keys(editedValues).length} modified)
                        </Text>
                      )}
                    </Text>
                  </Stack>
                </Group>
              </Box>

              {/* Parameter grid */}
              <ScrollArea style={{ flex: 1 }}>
                <Box
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: 0,
                  }}
                >
                  {/* Headers */}
                  <Text
                    fw={600}
                    style={{
                      fontSize: FONT_SIZES.small,
                      color: colors.gray[600],
                      padding: `${spacing.sm} ${spacing.lg}`,
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
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderBottom: `1px solid ${colors.gray[200]}`,
                      textAlign: 'right',
                    }}
                  >
                    Period
                  </Text>
                  <Text
                    fw={600}
                    style={{
                      fontSize: FONT_SIZES.small,
                      color: colors.gray[600],
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderBottom: `1px solid ${colors.gray[200]}`,
                      textAlign: 'right',
                    }}
                  >
                    Value
                  </Text>
                  <Box
                    style={{
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderBottom: `1px solid ${colors.gray[200]}`,
                    }}
                  />

                  {/* Rows */}
                  {SAMPLE_DISPLAY_PARAMS.map((param) => (
                    <InlineEditRow
                      key={param.paramName}
                      param={param}
                      isEditing={editingParam === param.paramName}
                      editedValue={editedValues[param.paramName]}
                      onStartEdit={() => setEditingParam(param.paramName)}
                      onCancelEdit={() => setEditingParam(null)}
                      onSaveEdit={(value) => {
                        setEditedValues((prev) => ({ ...prev, [param.paramName]: value }));
                        setEditingParam(null);
                      }}
                    />
                  ))}
                </Box>
              </ScrollArea>

              {/* Footer */}
              {hasEdits && (
                <Box
                  style={{
                    padding: spacing.lg,
                    borderTop: `1px solid ${colors.gray[200]}`,
                  }}
                >
                  <Group justify="flex-end">
                    <Button variant="subtle" color="gray" onClick={() => setEditedValues({})}>
                      Reset changes
                    </Button>
                    <Button color="teal">Save as new policy</Button>
                  </Group>
                </Box>
              )}
            </>
          ) : (
            <Box
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text c="dimmed">Select a policy to view details</Text>
            </Box>
          )}
        </Box>
      </Group>
    </ConceptShell>
  );
}

function InlineEditRow({
  param,
  isEditing,
  editedValue,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: {
  param: DisplayParam;
  isEditing: boolean;
  editedValue?: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState(editedValue || param.changes[0]?.value || '');
  const isModified = editedValue !== undefined;

  return (
    <>
      {/* Parameter name */}
      <Box
        style={{
          padding: `${spacing.sm} ${spacing.lg}`,
          borderBottom: `1px solid ${colors.gray[100]}`,
          background: isModified ? `${colors.primary[50]}44` : 'transparent',
        }}
      >
        <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[700], lineHeight: 1.4 }}>
          {param.label}
        </Text>
      </Box>

      {/* Period */}
      <Box
        style={{
          padding: `${spacing.sm} ${spacing.md}`,
          borderBottom: `1px solid ${colors.gray[100]}`,
          textAlign: 'right',
          background: isModified ? `${colors.primary[50]}44` : 'transparent',
        }}
      >
        {param.changes.map((change, idx) => (
          <Text
            key={idx}
            style={{ fontSize: FONT_SIZES.small, color: colors.gray[500], lineHeight: 1.4 }}
          >
            {change.period}
          </Text>
        ))}
      </Box>

      {/* Value */}
      <Box
        style={{
          padding: `${spacing.sm} ${spacing.md}`,
          borderBottom: `1px solid ${colors.gray[100]}`,
          textAlign: 'right',
          background: isModified ? `${colors.primary[50]}44` : 'transparent',
        }}
      >
        {isEditing ? (
          <Group gap={4} justify="flex-end">
            <TextInput
              size="xs"
              value={inputValue}
              onChange={(e) => setInputValue(e.currentTarget.value)}
              style={{ width: 80 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveEdit(inputValue);
                }
                if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
              data-autofocus
            />
            <ActionIcon
              size="xs"
              color="teal"
              variant="filled"
              onClick={() => onSaveEdit(inputValue)}
            >
              <IconCheck size={12} />
            </ActionIcon>
            <ActionIcon size="xs" color="gray" variant="subtle" onClick={onCancelEdit}>
              <IconX size={12} />
            </ActionIcon>
          </Group>
        ) : (
          <Stack gap={0} align="flex-end">
            {isModified && (
              <Text
                style={{
                  fontSize: FONT_SIZES.small,
                  color: colors.gray[400],
                  textDecoration: 'line-through',
                  lineHeight: 1.4,
                }}
              >
                {param.changes[0]?.value}
              </Text>
            )}
            <Text
              fw={500}
              style={{
                fontSize: FONT_SIZES.small,
                color: isModified ? colors.primary[700] : POLICY_COLOR.icon,
                lineHeight: 1.4,
              }}
            >
              {isModified ? editedValue : param.changes[0]?.value}
            </Text>
          </Stack>
        )}
      </Box>

      {/* Edit button */}
      <Box
        style={{
          padding: `${spacing.sm} ${spacing.sm}`,
          borderBottom: `1px solid ${colors.gray[100]}`,
          display: 'flex',
          alignItems: 'center',
          background: isModified ? `${colors.primary[50]}44` : 'transparent',
        }}
      >
        {!isEditing && (
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={onStartEdit}>
            <IconPencil size={12} />
          </ActionIcon>
        )}
      </Box>
    </>
  );
}
