import type { ReactNode } from 'react';
import { AppLink } from '@/components/AppLink';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stack,
  Text,
  Title,
} from '@/components/ui';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { isAssociationCountry, type AssociationCountryId } from '@/types/v2User';
import { getCountryLabel } from '@/utils/geographyUtils';

interface AccountSectionProps {
  /** The page's heading, the name of its link in the "My account" sidebar. */
  title: string;
  /** What a user signed in to the US or UK calculator sees. */
  children: (countryId: AssociationCountryId) => ReactNode;
}

/**
 * One page of the account settings: its heading, then what the visitor can
 * do there. Every page says the same when sign-in is disabled, in a country
 * without accounts (where it points to the US and UK), and to a signed-out
 * visitor (whom it offers sign-in); only a signed-in user in the US or UK
 * gets the page's own content.
 */
export default function AccountSection({ title, children }: AccountSectionProps) {
  const auth = useAuthStatus();
  const countryId = useCurrentCountry();

  let content: ReactNode;
  if (auth.status === 'disabled') {
    content = <Text style={{ margin: 0 }}>Signing in is not available here yet.</Text>;
  } else if (!isAssociationCountry(countryId)) {
    // Accounts are for the US and UK: elsewhere there is nothing to sign in to.
    content = (
      <>
        <Text style={{ margin: 0 }}>
          Accounts store work for the US and UK calculators. Work in the{' '}
          {getCountryLabel(countryId)} calculator stays on this device. Manage your account from{' '}
          <AppLink to="/us/account">the US calculator</AppLink> or{' '}
          <AppLink to="/uk/account">the UK calculator</AppLink>.
        </Text>
        {auth.status === 'signed_in' && (
          <div>
            <Button variant="outline" onClick={() => auth.signOut()}>
              Sign out
            </Button>
          </div>
        )}
      </>
    );
  } else if (auth.status === 'signed_out') {
    content = (
      <Card>
        <CardHeader>
          <CardTitle>Sign in to keep your work</CardTitle>
          <CardDescription>
            The reforms and reports you save now are kept for this browser. Sign in to keep them in
            your account and use them on any device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => auth.signIn()}>Sign in</Button>
        </CardContent>
      </Card>
    );
  } else {
    content = children(countryId);
  }

  return (
    <Stack gap="xl">
      <Title order={1} style={{ margin: 0 }}>
        {title}
      </Title>
      {content}
    </Stack>
  );
}
