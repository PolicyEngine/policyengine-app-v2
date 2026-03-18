import { useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const BANNER_DISMISSED_KEY = 'givecalc-banner-dismissed';

/**
 * Banner promoting GiveCalc for year-end giving
 * Only shows for US users on December 31, 2025
 */
export default function GiveCalcBanner() {
  const countryId = useCurrentCountry();
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(BANNER_DISMISSED_KEY) !== 'true';
    }
    return true;
  });

  // Only show for US users on December 31, 2025
  const currentDate = new Date();
  const isLastDay =
    currentDate.getFullYear() === 2025 &&
    currentDate.getMonth() === 11 && // December is month 11
    currentDate.getDate() === 31;

  if (countryId !== 'us' || !visible || !isLastDay) {
    return null;
  }

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    }
  };

  return (
    <div
      className="tw:relative tw:flex tw:items-center tw:justify-center"
      style={{
        backgroundColor: '#fef3c7',
        borderBottom: '1px solid #fcd34d',
        padding: `${spacing.sm} ${spacing.md}`,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <span
        className="tw:text-center"
        style={{ fontSize: typography.fontSize.sm, color: colors.gray[800] }}
      >
        Last day to make tax-deductible donations in 2025! See how much your giving saves on taxes
        at{' '}
        <a
          href="https://givecalc.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: colors.primary[700],
            fontWeight: typography.fontWeight.semibold,
            textDecoration: 'underline',
          }}
        >
          GiveCalc.org
        </a>
      </span>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Dismiss banner"
        className="tw:absolute tw:right-2 tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-1"
      >
        <IconX size={16} />
      </button>
    </div>
  );
}
