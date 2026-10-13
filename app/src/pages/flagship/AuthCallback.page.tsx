import { useEffect, useRef } from 'react';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { takeSignInReturnTo } from '@/libs/auth/AuthProvider';

/**
 * Where Auth0 sends the browser after sign-in. The AuthProvider finishes
 * the code exchange (showing its loading state meanwhile); this page then
 * returns to where sign-in started, and shows the error when sign-in did
 * not complete.
 */
export default function AuthCallbackPage() {
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();
  const { status, error } = useAuthStatus();
  const finished = useRef(false);

  useEffect(() => {
    if (finished.current || (status === 'signed_out' && error)) {
      return;
    }
    finished.current = true;
    const home = `/${countryId}`;
    nav.replace(status === 'signed_in' ? (takeSignInReturnTo() ?? home) : home);
  }, [status, error, countryId, nav]);

  if (status === 'signed_out' && error) {
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
