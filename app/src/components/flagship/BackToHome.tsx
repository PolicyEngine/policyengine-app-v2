import { IconArrowLeft } from '@tabler/icons-react';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * In-page way back to the Home launcher. Navigation lives in page
 * content, not in the header chrome.
 */
export default function BackToHome() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  return (
    <button
      type="button"
      onClick={() => nav.push(`/${countryId}/home`)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: 0,
        fontSize: typography.fontSize.sm,
        fontFamily: typography.fontFamily.primary,
        color: colors.text.secondary,
        alignSelf: 'flex-start',
      }}
    >
      <IconArrowLeft size={16} />
      Back to home
    </button>
  );
}
