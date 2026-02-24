/**
 * PolicyOverviewContent - Shared overview tab content for policy modals
 *
 * Renders the policy naming card and parameter modification grid.
 * Used by both PolicyCreationModal and PolicyBrowseModal.
 */
import { Fragment } from 'react';
import { IconScale } from '@tabler/icons-react';
import { Box, Group, Stack, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { EditableLabel } from '../../components/EditableLabel';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';
import type { ModifiedParam } from './types';

interface PolicyOverviewContentProps {
  policyLabel: string;
  onLabelChange: (label: string) => void;
  isReadOnly: boolean;
  modificationCount: number;
  modifiedParams: ModifiedParam[];
  hoveredParamName: string | null;
  onHoverParam: (name: string | null) => void;
  onClickParam: (paramName: string) => void;
}

const colorConfig = INGREDIENT_COLORS.policy;

export function PolicyOverviewContent({
  policyLabel,
  onLabelChange,
  isReadOnly,
  modificationCount,
  modifiedParams,
  hoveredParamName,
  onHoverParam,
  onClickParam,
}: PolicyOverviewContentProps) {
  return (
    <Stack gap={spacing.lg}>
      {/* Naming card */}
      <Box
        style={{
          background: colors.white,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: spacing.radius.lg,
          border: `1px solid ${modificationCount > 0 ? colorConfig.border : colors.border.light}`,
          boxShadow:
            modificationCount > 0
              ? `0 4px 20px ${colorConfig.border}40`
              : `0 2px 8px ${colors.shadow.light}`,
          padding: `${spacing.sm} ${spacing.lg}`,
          transition: 'all 0.3s ease',
        }}
      >
        <Group gap={spacing.md} align="center" wrap="nowrap">
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
          {isReadOnly ? (
            <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
              {policyLabel || 'Untitled policy'}
            </Text>
          ) : (
            <EditableLabel
              value={policyLabel}
              onChange={onLabelChange}
              placeholder="Enter policy name..."
              emptyStateText="Click to name your policy..."
            />
          )}
        </Group>
      </Box>

      {/* Parameter / Period / Value grid */}
      {modifiedParams.length === 0 ? (
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            gap: spacing.sm,
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.small, color: colors.gray[400] }}>
            No parameter changes{isReadOnly ? '' : ' yet'}
          </Text>
          {!isReadOnly && (
            <Text
              ta="center"
              style={{ fontSize: FONT_SIZES.tiny, color: colors.gray[400], maxWidth: 280 }}
            >
              Select a parameter from the sidebar to start modifying values.
            </Text>
          )}
        </Box>
      ) : (
        <Box
          style={{
            background: colors.white,
            borderRadius: spacing.radius.lg,
            border: `1px solid ${colors.border.light}`,
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
            {/* Column headers */}
            <Text
              fw={600}
              style={{
                fontSize: FONT_SIZES.tiny,
                color: colors.gray[500],
                padding: `${spacing.sm} ${spacing.md}`,
                borderBottom: `1px solid ${colors.gray[200]}`,
                background: colors.gray[50],
              }}
            >
              Parameter
            </Text>
            <Text
              fw={600}
              style={{
                fontSize: FONT_SIZES.tiny,
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
                fontSize: FONT_SIZES.tiny,
                color: colors.gray[500],
                padding: `${spacing.sm} ${spacing.md}`,
                borderBottom: `1px solid ${colors.gray[200]}`,
                background: colors.gray[50],
                textAlign: 'right',
              }}
            >
              Value
            </Text>

            {modifiedParams.map((param) => {
              const isHovered = hoveredParamName === param.paramName;
              const rowHandlers = {
                onClick: () => onClickParam(param.paramName),
                onMouseEnter: () => onHoverParam(param.paramName),
                onMouseLeave: () => onHoverParam(null),
              };
              return (
                <Fragment key={param.paramName}>
                  <Box
                    {...rowHandlers}
                    style={{
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderBottom: `1px solid ${colors.gray[100]}`,
                      cursor: 'pointer',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: FONT_SIZES.small,
                        color: isHovered ? colors.primary[600] : colors.gray[700],
                        lineHeight: 1.4,
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {param.label}
                    </Text>
                  </Box>
                  <Box
                    {...rowHandlers}
                    style={{
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderBottom: `1px solid ${colors.gray[100]}`,
                      textAlign: 'right',
                      cursor: 'pointer',
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
                    {...rowHandlers}
                    style={{
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderBottom: `1px solid ${colors.gray[100]}`,
                      textAlign: 'right',
                      cursor: 'pointer',
                    }}
                  >
                    {param.changes.map((c, i) => (
                      <Text
                        key={i}
                        fw={500}
                        style={{
                          fontSize: FONT_SIZES.small,
                          color: colorConfig.icon,
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
      )}
    </Stack>
  );
}
