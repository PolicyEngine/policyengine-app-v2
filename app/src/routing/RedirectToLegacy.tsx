import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Loader, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

/**
 * Component that redirects users to the legacy PolicyEngine site
 * Shows a brief message before redirecting
 */
export function RedirectToLegacy() {
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Show message briefly before redirecting
    const timer = setTimeout(() => {
      setShouldRedirect(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (shouldRedirect) {
      // Redirect to legacy site with the original path
      window.location.href = `https://legacy.policyengine.org${location.pathname}${location.search}${location.hash}`;
    }
  }, [shouldRedirect, location]);

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: spacing.md,
        backgroundColor: colors.primary[50],
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <Loader size="lg" color={colors.primary[600]} />
      <Text
        size="xl"
        fw={600}
        style={{
          color: colors.gray[900],
        }}
      >
        Redirecting to our legacy website...
      </Text>
    </Box>
  );
}
