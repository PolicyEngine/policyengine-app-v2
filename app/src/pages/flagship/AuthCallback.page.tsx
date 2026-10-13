import { useEffect, useRef, useState } from 'react';
import { fetchMe } from '@/api/v2Me';
import type { V2UserClient } from '@/api/v2UserClient';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { runAccountCreationImport } from '@/libs/auth/accountImport';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { takeSignInReturnTo } from '@/libs/auth/AuthProvider';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { isAssociationCountry } from '@/types/v2User';

/**
 * Signed in: calls `GET /v2/me` once (which creates the PolicyEngine user
 * on a first sign-in) and, when that request created the account, copies
 * this browser's signed-out v3 work into it. Existing accounts are not
 * offered an import. A failed `/v2/me` leaves the account to be created
 * by the next account request, without an import.
 */
async function setUpAccount(client: V2UserClient, countryId: string): Promise<boolean> {
  if (!isAssociationCountry(countryId)) {
    return false;
  }
  try {
    const me = await fetchMe(client, countryId);
    return me.account_created;
  } catch (error) {
    console.error('[AuthCallback] Could not load the PolicyEngine account:', error);
    return false;
  }
}

/**
 * Where Auth0 sends the browser after sign-in. The AuthProvider finishes
 * the code exchange (showing its loading state meanwhile); this page sets
 * up the account, then returns to where sign-in started. It shows the
 * error when sign-in did not complete.
 */
export default function AuthCallbackPage() {
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();
  const { status, error } = useAuthStatus();
  const client = useV2UserClient();
  const started = useRef(false);
  const [importing, setImporting] = useState(false);

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
      if (await setUpAccount(client, countryId)) {
        setImporting(true);
        await runAccountCreationImport({ client });
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
      <Text style={{ margin: 0, color: colors.text.secondary }}>
        {importing ? 'Adding the work saved on this browser to your account…' : 'Signing you in…'}
      </Text>
    </Stack>
  );
}
