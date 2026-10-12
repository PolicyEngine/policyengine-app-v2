import { useEffect } from 'react';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { wasSignInRedirectHandled } from '@/libs/auth/AuthProvider';

function hasSignInParams(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has('state') && (params.has('code') || params.has('error'));
}

/**
 * Where Auth0 sends the browser after sign-in. The AuthProvider finishes
 * the code exchange and navigates to where sign-in started; this page
 * shows progress meanwhile, and the error when sign-in did not complete.
 */
export default function AuthCallbackPage() {
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();
  const { status, error } = useAuthStatus();

  useEffect(() => {
    if (status === 'disabled') {
      nav.replace(`/${countryId}`);
      return;
    }
    // A visit without sign-in parameters (a reload, a bookmark) has nothing to finish.
    if (
      status !== 'loading' &&
      !error &&
      !wasSignInRedirectHandled() &&
      !hasSignInParams(window.location.search)
    ) {
      nav.replace(`/${countryId}`);
    }
  }, [status, error, countryId, nav]);

  if (error && status !== 'authenticated') {
    return (
      <Stack
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: spacing['3xl'],
          gap: spacing.md,
          alignItems: 'flex-start',
        }}
      >
        <Title order={2} style={{ margin: 0 }}>
          Sign-in did not complete
        </Title>
        <Text style={{ margin: 0, color: colors.text.secondary }}>{error.message}</Text>
        <Button onClick={() => nav.replace(`/${countryId}`)}>Back to PolicyEngine</Button>
      </Stack>
    );
  }

  return (
    <Stack
      role="status"
      aria-live="polite"
      style={{ padding: spacing['3xl'], gap: spacing.md, alignItems: 'center' }}
    >
      <Spinner size="sm" />
      <Text style={{ margin: 0, color: colors.text.secondary }}>Signing you in…</Text>
    </Stack>
  );
}
