/**
 * ActionCards - Editorial CTA Section
 *
 * A striking call-to-action with hover interactions
 * and sophisticated styling. Uses gold accent color
 * for the primary CTA button.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrowRight, IconChartBar, IconUsers } from '@tabler/icons-react';
import { Box, Container, Text, UnstyledButton } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function ActionCards() {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  return (
    <Container size="lg" style={{ paddingBottom: spacing['5xl'] }}>
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing['2xl'],
        }}
      >
        {/* Primary CTA - Gold Accent */}
        <PrimaryCTA
          onClick={() => navigate(`/${countryId}/reports`)}
          label="Start Analyzing"
          sublabel="Create your first policy report"
        />

        {/* Secondary Actions */}
        <Box
          style={{
            display: 'flex',
            gap: spacing.lg,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <SecondaryAction
            icon={<IconChartBar size={18} />}
            label="View Research"
            onClick={() => navigate(`/${countryId}/research`)}
          />
          <SecondaryAction
            icon={<IconUsers size={18} />}
            label="Meet the Team"
            onClick={() => navigate(`/${countryId}/team`)}
          />
        </Box>
      </Box>
    </Container>
  );
}

function PrimaryCTA({
  onClick,
  label,
  sublabel,
}: {
  onClick: () => void;
  label: string;
  sublabel: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <UnstyledButton
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.lg,
        padding: `${spacing.lg} ${spacing['2xl']}`,
        background: isHovered
          ? `linear-gradient(135deg, ${colors.accent[500]} 0%, ${colors.accent[400]} 100%)`
          : `linear-gradient(135deg, ${colors.accent[400]} 0%, ${colors.accent[300]} 100%)`,
        borderRadius: spacing.radius.xl,
        boxShadow: isHovered
          ? `0 8px 24px ${colors.accent[400]}40, 0 4px 12px rgba(0,0,0,0.1)`
          : `0 4px 16px ${colors.accent[400]}30, 0 2px 8px rgba(0,0,0,0.05)`,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 200ms ease-out',
        cursor: 'pointer',
      }}
    >
      <Box>
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.secondary[900],
            lineHeight: 1.2,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: typography.fontSize.sm,
            color: colors.secondary[700],
            opacity: 0.8,
          }}
        >
          {sublabel}
        </Text>
      </Box>
      <IconArrowRight
        size={22}
        color={colors.secondary[900]}
        style={{
          transition: 'transform 200ms ease',
          transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
        }}
      />
    </UnstyledButton>
  );
}

function SecondaryAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <UnstyledButton
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        padding: `${spacing.sm} ${spacing.lg}`,
        backgroundColor: isHovered ? colors.primary[50] : 'transparent',
        border: `1px solid ${isHovered ? colors.primary[200] : colors.border.light}`,
        borderRadius: spacing.radius.lg,
        transition: 'all 200ms ease',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          color: isHovered ? colors.primary[600] : colors.text.secondary,
          transition: 'color 200ms ease',
        }}
      >
        {icon}
      </span>
      <Text
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: isHovered ? colors.primary[700] : colors.text.secondary,
          transition: 'color 200ms ease',
        }}
      >
        {label}
      </Text>
    </UnstyledButton>
  );
}
