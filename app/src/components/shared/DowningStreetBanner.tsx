import { useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const BANNER_DISMISSED_KEY = 'downing-street-banner-dismissed';
const GOV_UK_ARTICLE_URL = 'https://fellows.ai.gov.uk/articles/nikhil-woodruff-micro-simulation';

/**
 * Promotional banner highlighting PolicyEngine's use at 10 Downing Street.
 * Shown at the top of the homepage for both US and UK users.
 * Dismissible with session storage persistence.
 */
export default function DowningStreetBanner() {
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

  // Show until end of February 2026
  const currentDate = new Date();
  const endDate = new Date('2026-02-28');

  if (currentDate > endDate) {
    return null;
  }

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    }
  };

  return (
    <a
      href={GOV_UK_ARTICLE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="tw:block tw:relative tw:no-underline tw:cursor-pointer tw:transition-opacity tw:duration-200 tw:hover:opacity-95"
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
          Featured
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colors.white,
          }}
        >
          {countryId === 'uk'
            ? 'Our technology supports policy analysis at 10 Downing Street'
            : "Our technology supports policy analysis at the UK Prime Minister's office"}
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
          Learn more →
        </Text>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        className="tw:absolute tw:top-1/2 tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-1 tw:rounded tw:hover:bg-white/10"
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
