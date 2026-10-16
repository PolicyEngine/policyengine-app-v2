import { useEffect, useRef } from 'react';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { runAccountUpgrade } from '@/libs/auth/accountUpgrade';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { takeSignInReturnTo } from '@/libs/auth/AuthProvider';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { isAssociationCountry } from '@/types/v2User';

/**
 * Where Auth0 sends the browser after sign-in. The AuthProvider finishes
 * the code exchange (showing its loading state meanwhile); this page
 * upgrades this browser's unauthenticated user into the account (see
 * runAccountUpgrade), which also creates the account on a first sign-in,
 * then returns to where sign-in started. It shows the error when sign-in
 * did not complete.
 */
export default function AuthCallbackPage() {
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();
  const { status, error } = useAuthStatus();
  const client = useV2UserClient();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || (status === 'signed_out' && error)) {
      return;
    }
    started.current = true;
    const home = `/${countryId}`;
    if (status !== 'signed_in') {
      nav.replace(home);
      return;
    }
    const returnTo = takeSignInReturnTo() ?? home;
    void (async () => {
      if (isAssociationCountry(countryId)) {
        await runAccountUpgrade({ client, countryId });
      }
      nav.replace(returnTo);
    })();
  }, [status, error, countryId, nav, client]);

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
