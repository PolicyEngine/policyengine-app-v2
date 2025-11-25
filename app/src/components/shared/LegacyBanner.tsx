import { useState } from 'react';
import { Alert, Anchor } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const BANNER_DISMISSED_KEY = 'legacy-banner-dismissed';

/**
 * Banner that displays a message about the redesigned website
 * and provides a link to the legacy site
 */
export default function LegacyBanner() {
  const countryId = useCurrentCountry();
  const [visible, setVisible] = useState(() => {
    // Check session storage on initial render
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(BANNER_DISMISSED_KEY) !== 'true';
    }
    return true;
  });

  // Check if current date is before November 10, 2025
  const currentDate = new Date();
  const cutoffDate = new Date('2025-11-10');
  const isPreview = currentDate < cutoffDate;

  const message = isPreview
    ? "You're viewing a preview of our redesigned website."
    : 'Welcome to our redesigned website.';

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Alert
      withCloseButton
      closeButtonLabel="Dismiss banner"
      onClose={handleClose}
      styles={{
        root: {
          backgroundColor: colors.primary[50],
          borderBottom: `1px solid ${colors.primary[200]}`,
          borderRadius: 0,
          padding: `${spacing.sm} ${spacing.md}`,
          fontFamily: typography.fontFamily.primary,
        },
        message: {
          textAlign: 'center',
          fontSize: '14px',
          color: colors.gray[800],
        },
      }}
    >
      {message} To visit our legacy website, click{' '}
      <Anchor
        href={`https://legacy.policyengine.org/${countryId}`}
        target="_blank"
        rel="noopener noreferrer"
        size="sm"
        style={{
          color: colors.primary[700],
          fontWeight: typography.fontWeight.semibold,
          textDecoration: 'underline',
        }}
      >
        here
      </Anchor>
      .
    </Alert>
  );
}
