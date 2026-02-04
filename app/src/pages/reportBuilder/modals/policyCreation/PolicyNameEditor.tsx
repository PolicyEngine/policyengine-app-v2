/**
 * PolicyNameEditor - Editable policy name at top of parameter setter pane
 */

import React from 'react';
import { IconPencil, IconScale } from '@tabler/icons-react';
import { ActionIcon, Box, Group, Text, TextInput } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';

export interface PolicyNameEditorProps {
  policyLabel: string;
  isEditingLabel: boolean;
  onLabelChange: (label: string) => void;
  onEditingChange: (editing: boolean) => void;
}

export function PolicyNameEditor({
  policyLabel,
  isEditingLabel,
  onLabelChange,
  onEditingChange,
}: PolicyNameEditorProps) {
  const colorConfig = INGREDIENT_COLORS.policy;

  return (
    <Box
      style={{
        background: colors.white,
        borderRadius: spacing.radius.lg,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
      }}
    >
      <Group gap={spacing.md} align="center" wrap="nowrap">
        {/* Policy icon */}
        <Box
          style={{
            width: 32,
            height: 32,
            borderRadius: spacing.radius.md,
            background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
            border: `1px solid ${colorConfig.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconScale size={18} color={colorConfig.icon} />
        </Box>

        {/* Editable policy name */}
        <Box style={{ flex: 1, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          {isEditingLabel ? (
            <TextInput
              value={policyLabel}
              onChange={(e) => onLabelChange(e.currentTarget.value)}
              onBlur={() => onEditingChange(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onEditingChange(false);
                }
                if (e.key === 'Escape') {
                  onEditingChange(false);
                }
              }}
              autoFocus
              size="sm"
              style={{ flex: 1 }}
              styles={{
                input: {
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: 600,
                  fontSize: FONT_SIZES.normal,
                },
              }}
            />
          ) : (
            <>
              <Text
                fw={600}
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontSize: FONT_SIZES.normal,
                  color: colors.gray[800],
                }}
              >
                {policyLabel || 'New policy'}
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={() => onEditingChange(true)}
              >
                <IconPencil size={14} />
              </ActionIcon>
            </>
          )}
        </Box>
      </Group>
    </Box>
  );
}
