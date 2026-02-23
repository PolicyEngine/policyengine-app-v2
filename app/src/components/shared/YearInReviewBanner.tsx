import { useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { Text } from '@/components/ui';
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

  const yearInReviewUrl =
    countryId === 'uk' ? '/uk/2025-year-in-review' : '/us/2025-year-in-review';

  return (
    <a
      href={yearInReviewUrl}
      className="tw:block tw:relative tw:no-underline tw:cursor-pointer tw:transition-opacity tw:duration-200 hover:tw:opacity-95"
      style={{
        background: `linear-gradient(135deg, #0F172A 0%, #1E293B 50%, ${colors.primary[700]} 100%)`,
        padding: `${spacing.md} ${spacing.xl}`,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <div
        className="tw:flex tw:justify-center tw:items-center tw:flex-wrap"
        style={{
          gap: spacing.lg,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.bold,
            color: colors.primary[300],
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          New
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.white,
          }}
        >
          Explore our 2025 Year in Review
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.primary[300],
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          See what we built →
        </Text>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        className="tw:absolute tw:top-1/2 tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-1 tw:rounded hover:tw:bg-white/10"
        style={{
          right: spacing.lg,
          transform: 'translateY(-50%)',
          color: colors.white,
          opacity: 0.7,
        }}
      >
        <IconX size={16} />
      </button>
    </a>
  );
}
