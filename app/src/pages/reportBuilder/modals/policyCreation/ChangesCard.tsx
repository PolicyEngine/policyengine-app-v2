/**
 * ChangesCard - Displays list of modified parameters with their changes
 */

import React from 'react';
import { IconTrash } from '@tabler/icons-react';
import { Badge, Button, Group, Stack, Text } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { ChangesCardProps } from './types';

export function ChangesCard({
  modifiedParams,
  isReadOnly = false,
  onRemoveChange,
}: ChangesCardProps) {
  if (modifiedParams.length === 0) {
    return null;
  }

  const canRemoveChanges = !isReadOnly && Boolean(onRemoveChange);
  const changes = modifiedParams.flatMap((param) =>
    param.changes.map((change) => ({
      ...change,
      paramName: param.paramName,
    }))
  );

  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
        padding: spacing.lg,
      }}
    >
      <Group justify="space-between" style={{ marginBottom: spacing.sm }}>
        <Text size="sm" fw={600} style={{ color: colors.gray[700] }}>
          Changes for this parameter
        </Text>
        <Badge variant="secondary">{changes.length}</Badge>
      </Group>
      <Stack gap="xs">
        {changes.map((change) => (
          <Group
            key={`${change.paramName}-${change.index}`}
            justify="space-between"
            style={{
              padding: spacing.sm,
              background: colors.gray[50],
              borderRadius: spacing.radius.element,
            }}
          >
            <Text size="xs" style={{ color: colors.gray[600] }}>
              {change.period}
            </Text>
            <Group gap="xs">
              <Text size="xs" fw={600} style={{ color: colors.primary[700] }}>
                {change.value}
              </Text>
              {canRemoveChanges && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove ${change.period} change`}
                  onClick={() => onRemoveChange?.(change.paramName, change.index)}
                >
                  <IconTrash size={12} />
                </Button>
              )}
            </Group>
          </Group>
        ))}
      </Stack>
    </div>
  );
}
