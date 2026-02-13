/**
 * PolicyCreationHeader - Modal header with editable policy name, modification count, and close button
 */

import React from 'react';
import { IconPencil, IconScale, IconX } from '@tabler/icons-react';
import { ActionIcon, Box, Group, Text, TextInput } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';

export interface PolicyCreationHeaderProps {
  policyLabel: string;
  isEditingLabel: boolean;
  modificationCount: number;
  onLabelChange: (label: string) => void;
  onEditingChange: (editing: boolean) => void;
  onClose: () => void;
}

export function PolicyCreationHeader({
  policyLabel,
  isEditingLabel,
  modificationCount,
  onLabelChange,
  onEditingChange,
  onClose,
}: PolicyCreationHeaderProps) {
  const colorConfig = INGREDIENT_COLORS.policy;

  return (
    <Box style={{ width: '100%' }}>
      <Group justify="space-between" align="center" wrap="nowrap">
        {/* Left side: Policy icon and name */}
        <Group gap={spacing.md} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
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
          <Box style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
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
                placeholder="Untitled policy"
                autoFocus
                size="xs"
                style={{ width: 250 }}
                styles={{
                  input: {
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: 600,
                    fontSize: FONT_SIZES.normal,
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
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
                    color: policyLabel ? colors.gray[800] : colors.gray[400],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {policyLabel || 'Untitled policy'}
                </Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => onEditingChange(true)}
                  style={{ flexShrink: 0 }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </>
            )}
          </Box>
        </Group>

        {/* Right side: Modification count + Close */}
        <Group gap={spacing.md} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          {/* Modification count */}
          <Group gap={spacing.xs} style={{ flexShrink: 0 }}>
            {modificationCount > 0 ? (
              <>
                <Box
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: colors.primary[500],
                  }}
                />
                <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[600] }}>
                  {modificationCount} parameter{modificationCount !== 1 ? 's' : ''} modified
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
                No changes yet
              </Text>
            )}
          </Group>

          {/* Close button */}
          <ActionIcon variant="subtle" color="gray" onClick={onClose} style={{ flexShrink: 0 }}>
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  );
}
