/**
 * PolicyCreationHeader - Modal header with editable policy name, modification count, and close button
 */

import React from 'react';
import { IconPencil, IconScale, IconX } from '@tabler/icons-react';
import { Button, Group, Input, Text } from '@/components/ui';
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
    <div style={{ width: '100%' }}>
      <Group justify="space-between" align="center" wrap="nowrap">
        {/* Left side: Policy icon and name */}
        <Group gap="md" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
          {/* Policy icon */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: spacing.radius.container,
              background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colors.white} 100%)`,
              border: `1px solid ${colorConfig.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconScale size={18} color={colorConfig.icon} />
          </div>

          {/* Editable policy name */}
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            {isEditingLabel ? (
              <Input
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
                className="tw:border-none tw:bg-transparent tw:p-0 tw:h-auto tw:shadow-none tw:focus-visible:ring-0"
                style={{
                  width: 250,
                  fontFamily: typography.fontFamily.primary,
                  fontWeight: 600,
                  fontSize: FONT_SIZES.normal,
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEditingChange(true)}
                  style={{ flexShrink: 0 }}
                >
                  <IconPencil size={14} />
                </Button>
              </>
            )}
          </div>
        </Group>

        {/* Right side: Modification count + Close */}
        <Group gap="md" align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
          {/* Modification count */}
          <Group gap="xs" style={{ flexShrink: 0 }}>
            {modificationCount > 0 ? (
              <>
                <div
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
          <Button variant="ghost" size="icon-sm" onClick={onClose} style={{ flexShrink: 0 }}>
            <IconX size={18} />
          </Button>
        </Group>
      </Group>
    </div>
  );
}
