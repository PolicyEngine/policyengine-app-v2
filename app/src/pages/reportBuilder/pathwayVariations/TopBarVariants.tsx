/**
 * TopBarVariants - Five redesigns for the report builder top bar
 *
 * Each variant addresses:
 * - Buttons that are proportional (not stretched to bar height)
 * - Clear editability affordances for name and year
 */

import { Box, Group, Paper, Text } from '@mantine/core';
import {
  IconCopy,
  IconFileDescription,
  IconPencil,
  IconPlayerPlay,
  IconRefresh,
  IconSelector,
} from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import { FONT_SIZES } from '../constants';

const MOCK = {
  label: 'Child benefit expansion analysis',
  year: '2025',
  lastRun: '2 hours ago',
};

// ============================================================================
// SHARED ELEMENTS
// ============================================================================

function PrimaryButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <Box
      component="button"
      style={{
        background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
        color: 'white',
        border: 'none',
        borderRadius: spacing.radius.lg,
        padding: `${spacing.sm} ${spacing.lg}`,
        fontFamily: typography.fontFamily.primary,
        fontWeight: 600,
        fontSize: FONT_SIZES.normal,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        boxShadow: '0 4px 12px rgba(44, 122, 123, 0.3)',
        whiteSpace: 'nowrap' as const,
        flexShrink: 0,
      }}
    >
      {icon}
      <span>{label}</span>
    </Box>
  );
}

function SecondaryButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <Box
      component="button"
      style={{
        background: colors.secondary[100],
        color: colors.secondary[700],
        border: `1px solid ${colors.secondary[200]}`,
        borderRadius: spacing.radius.lg,
        padding: `${spacing.sm} ${spacing.lg}`,
        fontFamily: typography.fontFamily.primary,
        fontWeight: 600,
        fontSize: FONT_SIZES.normal,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        whiteSpace: 'nowrap' as const,
        flexShrink: 0,
      }}
    >
      {icon}
      <span>{label}</span>
    </Box>
  );
}

function VariantLabel({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <Box style={{ marginBottom: spacing.md }}>
      <Text
        fw={700}
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: FONT_SIZES.normal,
          color: colors.gray[800],
        }}
      >
        {number}. {title}
      </Text>
      <Text
        c={colors.gray[500]}
        style={{ fontSize: FONT_SIZES.small, marginTop: 2 }}
      >
        {description}
      </Text>
    </Box>
  );
}

// ============================================================================
// VARIANT A: Centered buttons (fix the stretch, keep the layout)
// ============================================================================

function VariantA() {
  return (
    <Box>
      <VariantLabel
        number={1}
        title="Centered buttons"
        description="Same layout, but buttons use their own height and center vertically. Editable fields get visible pencil icons."
      />
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        {/* Meta panel */}
        <Box
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: spacing.radius.xl,
            border: `1px solid ${colors.primary[200]}`,
            boxShadow: '0 8px 32px rgba(44, 122, 123, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
            padding: `${spacing.md} ${spacing.xl}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: spacing.radius.md,
              background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconFileDescription size={18} color={colors.primary[600]} />
          </Box>

          {/* Editable name */}
          <Box
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `2px ${spacing.sm}`,
              borderRadius: spacing.radius.md,
              border: `1px dashed ${colors.gray[300]}`,
              background: colors.gray[50],
              cursor: 'pointer',
            }}
          >
            <Text
              fw={600}
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: FONT_SIZES.normal,
                color: colors.gray[800],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {MOCK.label}
            </Text>
            <IconPencil size={12} color={colors.gray[400]} style={{ flexShrink: 0 }} />
          </Box>

          <Box
            style={{
              width: '1px',
              height: '24px',
              background: colors.gray[200],
              flexShrink: 0,
            }}
          />

          {/* Editable year */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: `2px ${spacing.sm}`,
              borderRadius: spacing.radius.md,
              border: `1px dashed ${colors.gray[300]}`,
              background: colors.gray[50],
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: FONT_SIZES.normal,
                fontWeight: 500,
                color: colors.gray[600],
              }}
            >
              {MOCK.year}
            </Text>
            <IconSelector size={12} color={colors.gray[400]} />
          </Box>
        </Box>

        {/* Buttons - centered, not stretched */}
        <PrimaryButton label="Re-run" icon={<IconPlayerPlay size={16} />} />
        <SecondaryButton label="Copy report" icon={<IconCopy size={16} />} />
      </Box>
    </Box>
  );
}

// ============================================================================
// VARIANT B: Two-row bar (info on top, actions below)
// ============================================================================

function VariantB() {
  return (
    <Box>
      <VariantLabel
        number={2}
        title="Two-row bar"
        description="Stacked layout: editable report info on top, slim action strip below with compact buttons."
      />
      <Paper
        style={{
          borderRadius: spacing.radius.xl,
          border: `1px solid ${colors.primary[200]}`,
          boxShadow: '0 8px 32px rgba(44, 122, 123, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Top row: meta info */}
        <Box
          style={{
            padding: `${spacing.md} ${spacing.xl}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: spacing.radius.md,
              background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconFileDescription size={18} color={colors.primary[600]} />
          </Box>

          {/* Editable name with underline */}
          <Box
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              cursor: 'pointer',
            }}
          >
            <Text
              fw={600}
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: '16px',
                color: colors.gray[800],
                borderBottom: `2px dashed ${colors.primary[200]}`,
                paddingBottom: 2,
              }}
            >
              {MOCK.label}
            </Text>
            <IconPencil size={14} color={colors.primary[400]} style={{ flexShrink: 0 }} />
          </Box>

          <Box
            style={{
              width: '1px',
              height: '24px',
              background: colors.gray[200],
              flexShrink: 0,
            }}
          />

          {/* Editable year with underline */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Text
              fw={500}
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: '16px',
                color: colors.gray[600],
                borderBottom: `2px dashed ${colors.primary[200]}`,
                paddingBottom: 2,
              }}
            >
              {MOCK.year}
            </Text>
            <IconPencil size={12} color={colors.primary[400]} />
          </Box>

          {/* Last run */}
          <Group gap={spacing.xs} style={{ flexShrink: 0, marginLeft: spacing.md }}>
            <IconRefresh size={14} color={colors.gray[400]} />
            <Text c={colors.gray[500]} style={{ fontSize: FONT_SIZES.small }}>
              Last run {MOCK.lastRun}
            </Text>
          </Group>
        </Box>

        {/* Bottom row: action strip */}
        <Box
          style={{
            padding: `${spacing.sm} ${spacing.xl}`,
            background: colors.gray[50],
            borderTop: `1px solid ${colors.gray[100]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: spacing.sm,
          }}
        >
          <SecondaryButton label="Copy report" icon={<IconCopy size={14} />} />
          <PrimaryButton label="Re-run" icon={<IconPlayerPlay size={14} />} />
        </Box>
      </Paper>
    </Box>
  );
}

// ============================================================================
// VARIANT C: Inline editable fields with pill buttons
// ============================================================================

function VariantC() {
  return (
    <Box>
      <VariantLabel
        number={3}
        title="Inline editable fields"
        description="Name and year rendered as input-like fields with bottom borders. Pill-shaped buttons on the right."
      />
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        {/* Meta panel with input-like fields */}
        <Box
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: spacing.radius.xl,
            border: `1px solid ${colors.primary[200]}`,
            boxShadow: '0 8px 32px rgba(44, 122, 123, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
            padding: `${spacing.md} ${spacing.xl}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.lg,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: spacing.radius.md,
              background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconFileDescription size={18} color={colors.primary[600]} />
          </Box>

          {/* Name field */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text
              c={colors.gray[400]}
              style={{
                fontSize: FONT_SIZES.tiny,
                fontFamily: typography.fontFamily.primary,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 2,
              }}
            >
              Report name
            </Text>
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                borderBottom: `2px solid ${colors.primary[300]}`,
                paddingBottom: 3,
                cursor: 'text',
              }}
            >
              <Text
                fw={600}
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontSize: FONT_SIZES.normal,
                  color: colors.gray[800],
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {MOCK.label}
              </Text>
              <IconPencil size={12} color={colors.primary[400]} style={{ flexShrink: 0 }} />
            </Box>
          </Box>

          {/* Year field */}
          <Box style={{ flexShrink: 0 }}>
            <Text
              c={colors.gray[400]}
              style={{
                fontSize: FONT_SIZES.tiny,
                fontFamily: typography.fontFamily.primary,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 2,
              }}
            >
              Year
            </Text>
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                borderBottom: `2px solid ${colors.primary[300]}`,
                paddingBottom: 3,
                cursor: 'pointer',
              }}
            >
              <Text
                fw={500}
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontSize: FONT_SIZES.normal,
                  color: colors.gray[600],
                }}
              >
                {MOCK.year}
              </Text>
              <IconSelector size={12} color={colors.primary[400]} />
            </Box>
          </Box>

          {/* Last run */}
          <Group gap={spacing.xs} style={{ flexShrink: 0 }}>
            <IconRefresh size={14} color={colors.gray[400]} />
            <Text c={colors.gray[500]} style={{ fontSize: FONT_SIZES.small }}>
              {MOCK.lastRun}
            </Text>
          </Group>
        </Box>

        {/* Pill buttons */}
        <Box style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <Box
            component="button"
            style={{
              background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: 999,
              padding: `${spacing.sm} ${spacing.xl}`,
              fontFamily: typography.fontFamily.primary,
              fontWeight: 600,
              fontSize: FONT_SIZES.normal,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              boxShadow: '0 4px 12px rgba(44, 122, 123, 0.3)',
              whiteSpace: 'nowrap' as const,
            }}
          >
            <IconPlayerPlay size={14} />
            <span>Re-run</span>
          </Box>
          <Box
            component="button"
            style={{
              background: colors.secondary[100],
              color: colors.secondary[700],
              border: `1px solid ${colors.secondary[200]}`,
              borderRadius: 999,
              padding: `${spacing.sm} ${spacing.xl}`,
              fontFamily: typography.fontFamily.primary,
              fontWeight: 600,
              fontSize: FONT_SIZES.normal,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              whiteSpace: 'nowrap' as const,
            }}
          >
            <IconCopy size={14} />
            <span>Copy report</span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================================
// VARIANT D: Integrated toolbar (everything in one bar, buttons inside)
// ============================================================================

function VariantD() {
  return (
    <Box>
      <VariantLabel
        number={4}
        title="Integrated toolbar"
        description="All elements in one unified bar. Name and year as tappable chips. Buttons integrated on the right after a divider."
      />
      <Box
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: spacing.radius.xl,
          border: `1px solid ${colors.primary[200]}`,
          boxShadow: '0 8px 32px rgba(44, 122, 123, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
          padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <Box
          style={{
            width: 28,
            height: 28,
            borderRadius: spacing.radius.sm,
            background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconFileDescription size={16} color={colors.primary[600]} />
        </Box>

        {/* Name chip */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: spacing.radius.md,
            background: colors.primary[50],
            border: `1px solid ${colors.primary[200]}`,
            cursor: 'pointer',
            flex: 1,
            minWidth: 0,
          }}
        >
          <Text
            fw={600}
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: FONT_SIZES.normal,
              color: colors.gray[800],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {MOCK.label}
          </Text>
          <IconPencil size={12} color={colors.primary[500]} style={{ flexShrink: 0 }} />
        </Box>

        {/* Year chip */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: spacing.radius.md,
            background: colors.primary[50],
            border: `1px solid ${colors.primary[200]}`,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Text
            fw={500}
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: FONT_SIZES.normal,
              color: colors.gray[700],
            }}
          >
            {MOCK.year}
          </Text>
          <IconSelector size={12} color={colors.primary[500]} />
        </Box>

        {/* Last run */}
        <Group gap={spacing.xs} style={{ flexShrink: 0 }}>
          <IconRefresh size={12} color={colors.gray[400]} />
          <Text c={colors.gray[500]} style={{ fontSize: FONT_SIZES.tiny }}>
            {MOCK.lastRun}
          </Text>
        </Group>

        {/* Divider */}
        <Box
          style={{
            width: '1px',
            height: '28px',
            background: colors.gray[200],
            flexShrink: 0,
          }}
        />

        {/* Compact buttons inside the bar */}
        <Box
          component="button"
          style={{
            background: colors.secondary[100],
            color: colors.secondary[700],
            border: `1px solid ${colors.secondary[200]}`,
            borderRadius: spacing.radius.lg,
            padding: `${spacing.xs} ${spacing.md}`,
            fontFamily: typography.fontFamily.primary,
            fontWeight: 600,
            fontSize: FONT_SIZES.small,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap' as const,
            flexShrink: 0,
          }}
        >
          <IconCopy size={14} />
          <span>Copy</span>
        </Box>

        <Box
          component="button"
          style={{
            background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: spacing.radius.lg,
            padding: `${spacing.xs} ${spacing.md}`,
            fontFamily: typography.fontFamily.primary,
            fontWeight: 600,
            fontSize: FONT_SIZES.small,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 2px 8px rgba(44, 122, 123, 0.25)',
            whiteSpace: 'nowrap' as const,
            flexShrink: 0,
          }}
        >
          <IconPlayerPlay size={14} />
          <span>Re-run</span>
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================================
// VARIANT E: Breadcrumb-style editable segments
// ============================================================================

function VariantE() {
  return (
    <Box>
      <VariantLabel
        number={5}
        title="Segmented breadcrumb"
        description="Each piece of metadata is a distinct editable segment. Buttons sit in their own right-aligned group."
      />
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        {/* Icon segment */}
        <Box
          style={{
            width: 44,
            height: 44,
            borderRadius: spacing.radius.lg,
            background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
            border: `1px solid ${colors.primary[200]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconFileDescription size={20} color={colors.primary[600]} />
        </Box>

        {/* Name segment */}
        <Box
          style={{
            flex: 1,
            minWidth: 0,
            height: 44,
            borderRadius: spacing.radius.lg,
            background: colors.white,
            border: `1px solid ${colors.primary[200]}`,
            boxShadow: `0 2px 8px ${colors.shadow.light}`,
            padding: `0 ${spacing.lg}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            cursor: 'pointer',
          }}
        >
          <Text
            c={colors.primary[500]}
            fw={600}
            style={{
              fontSize: FONT_SIZES.tiny,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            Name
          </Text>
          <Text
            fw={600}
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: FONT_SIZES.normal,
              color: colors.gray[800],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {MOCK.label}
          </Text>
          <IconPencil size={12} color={colors.gray[400]} style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </Box>

        {/* Year segment */}
        <Box
          style={{
            height: 44,
            borderRadius: spacing.radius.lg,
            background: colors.white,
            border: `1px solid ${colors.primary[200]}`,
            boxShadow: `0 2px 8px ${colors.shadow.light}`,
            padding: `0 ${spacing.lg}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Text
            c={colors.primary[500]}
            fw={600}
            style={{
              fontSize: FONT_SIZES.tiny,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Year
          </Text>
          <Text
            fw={500}
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: FONT_SIZES.normal,
              color: colors.gray[700],
            }}
          >
            {MOCK.year}
          </Text>
          <IconSelector size={12} color={colors.gray[400]} />
        </Box>

        {/* Last run segment */}
        <Box
          style={{
            height: 44,
            borderRadius: spacing.radius.lg,
            background: colors.gray[50],
            border: `1px solid ${colors.gray[200]}`,
            padding: `0 ${spacing.md}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            flexShrink: 0,
          }}
        >
          <IconRefresh size={14} color={colors.gray[400]} />
          <Text c={colors.gray[500]} style={{ fontSize: FONT_SIZES.small }}>
            {MOCK.lastRun}
          </Text>
        </Box>

        {/* Button group */}
        <Box style={{ display: 'flex', gap: spacing.xs, flexShrink: 0 }}>
          <Box
            component="button"
            style={{
              height: 44,
              background: colors.secondary[100],
              color: colors.secondary[700],
              border: `1px solid ${colors.secondary[200]}`,
              borderRadius: spacing.radius.lg,
              padding: `0 ${spacing.lg}`,
              fontFamily: typography.fontFamily.primary,
              fontWeight: 600,
              fontSize: FONT_SIZES.normal,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              whiteSpace: 'nowrap' as const,
            }}
          >
            <IconCopy size={14} />
            <span>Copy</span>
          </Box>
          <Box
            component="button"
            style={{
              height: 44,
              background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: spacing.radius.lg,
              padding: `0 ${spacing.lg}`,
              fontFamily: typography.fontFamily.primary,
              fontWeight: 600,
              fontSize: FONT_SIZES.normal,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              boxShadow: '0 4px 12px rgba(44, 122, 123, 0.3)',
              whiteSpace: 'nowrap' as const,
            }}
          >
            <IconPlayerPlay size={14} />
            <span>Re-run</span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ============================================================================
// COMBINED EXPORT
// ============================================================================

export function TopBarVariants() {
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: spacing['2xl'] }}>
      <VariantA />
      <VariantB />
      <VariantC />
      <VariantD />
      <VariantE />
    </Box>
  );
}
