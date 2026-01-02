import { useState } from 'react';
import { Box, CloseButton, Group, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const BANNER_DISMISSED_KEY = 'year-in-review-2025-banner-dismissed';

export default function YearInReviewBanner() {
  const countryId = useCurrentCountry();
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(BANNER_DISMISSED_KEY) !== 'true';
    }
    return true;
  });

  if (!visible) {
    return null;
  }

  // Show until end of January 2026
  const currentDate = new Date();
  const endDate = new Date('2026-01-31');

  if (currentDate > endDate) {
    return null;
  }

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    }
  };

  const yearInReviewUrl = countryId === 'uk'
    ? '/uk/2025-year-in-review'
    : '/us/2025-year-in-review';

  return (
    <Box
      component="a"
      href={yearInReviewUrl}
      style={{
        display: 'block',
        position: 'relative',
        background: `linear-gradient(135deg, #0F172A 0%, #1E293B 50%, ${colors.primary[700]} 100%)`,
        padding: `${spacing.md} ${spacing.xl}`,
        fontFamily: typography.fontFamily.primary,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.95';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      <Group
        justify="center"
        align="center"
        gap={spacing.lg}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <Text
          size={typography.fontSize.sm}
          fw={typography.fontWeight.bold}
          c={colors.primary[300]}
          style={{
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          New
        </Text>
        <Text
          size={typography.fontSize.base}
          fw={typography.fontWeight.semibold}
          c={colors.white}
        >
          Explore our 2025 Year in Review
        </Text>
        <Text
          size={typography.fontSize.sm}
          c={colors.primary[300]}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          See what we built →
        </Text>
      </Group>

      <CloseButton
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        size="sm"
        style={{
          position: 'absolute',
          top: '50%',
          right: spacing.lg,
          transform: 'translateY(-50%)',
          color: colors.white,
          opacity: 0.7,
        }}
        styles={{
          root: {
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              opacity: 1,
            },
          },
        }}
      />
    </Box>
  );
}
