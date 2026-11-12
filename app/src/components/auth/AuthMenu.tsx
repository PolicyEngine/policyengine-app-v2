import { useState } from 'react';
import { IconBuilding, IconLogout, IconUserCircle } from '@tabler/icons-react';
import { organizationUsersPath } from '@/components/admin/organizationSettingsPages';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserType } from '@/hooks/useUserType';
import { useAuthStatus, type AuthContextValue } from '@/libs/auth/AuthContext';
import { isAssociationCountry, userTypeMeetsMinimum } from '@/types/v2User';

interface AuthMenuProps {
  /** 'inverse' for the teal calculator header; 'default' for light bars. */
  variant?: 'default' | 'inverse';
}

/** The name or email to show for the signed-in user (from the Auth0 ID token). */
export function accountDisplayName(auth: Pick<AuthContextValue, 'profile'>): string {
  return auth.profile?.name || auth.profile?.email || 'Account';
}

function initialOf(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

/**
 * The v3 header's sign-in control: "Sign in" when signed out (with a note
 * when the last session ended on its own), the user menu (My account,
 * My organization for admins, Sign out) when signed in, and nothing when
 * sign-in is disabled or outside the US and UK.
 */
export default function AuthMenu({ variant = 'default' }: AuthMenuProps) {
  const auth = useAuthStatus();
  const countryId = useCurrentCountry();
  const inverse = variant === 'inverse';

  // Accounts hold US and UK work only; elsewhere v3 stays in this browser.
  if (auth.status === 'disabled' || !isAssociationCountry(countryId)) {
    return null;
  }

  if (auth.status === 'signed_out') {
    return (
      <div className="tw:flex tw:items-center tw:gap-2">
        {auth.sessionEnded && (
          <span
            role="status"
            style={{
              fontSize: typography.fontSize.xs,
              color: inverse ? colors.text.inverse : colors.text.secondary,
            }}
          >
            Your session ended. Sign in again to keep saving to your account.
          </span>
        )}
        <Button
          size="sm"
          variant={inverse ? 'outline' : 'default'}
          onClick={() => auth.signIn()}
          style={
            inverse
              ? {
                  background: 'transparent',
                  color: colors.text.inverse,
                  borderColor: colors.text.inverse,
                }
              : undefined
          }
        >
          Sign in
        </Button>
      </div>
    );
  }

  return <SignedInAccountMenu auth={auth} countryId={countryId} inverse={inverse} />;
}

/**
 * The signed-in user's menu. It reads the user's type (`GET /v2/me`) while
 * the header shows, not only once the menu opens, so that for an admin
 * "My organization" is normally there when the menu opens. Whether the
 * item shows is decided as the menu opens and kept until it closes: an
 * answer that arrives while it is open changes the next opening only, so
 * no item is added above "Sign out" while the user is choosing one.
 */
function SignedInAccountMenu({
  auth,
  countryId,
  inverse,
}: {
  auth: AuthContextValue;
  countryId: string;
  inverse: boolean;
}) {
  const nav = useAppNavigate();
  const userType = useUserType();
  const isAdmin = userType !== null && userTypeMeetsMinimum(userType, 'admin');
  const [open, setOpen] = useState(false);
  const [showOrganization, setShowOrganization] = useState(false);
  const name = accountDisplayName(auth);
  const email = auth.profile?.email;

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      setShowOrganization(isAdmin);
    }
    setOpen(nextOpen);
  };

  return (
    <DropdownMenu open={open} onOpenChange={changeOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${name}`}
          className="tw:cursor-pointer tw:rounded-full tw:border-none tw:p-0"
          style={{ background: 'transparent', lineHeight: 0 }}
        >
          <span
            aria-hidden
            className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-full"
            style={{
              width: 30,
              height: 30,
              background: inverse ? colors.white : colors.primary[50],
              color: colors.primary[700],
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {initialOf(name)}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" style={{ minWidth: 220 }}>
        <DropdownMenuLabel>
          <div style={{ fontWeight: typography.fontWeight.semibold }}>{name}</div>
          {email && email !== name && (
            <div
              style={{
                fontWeight: typography.fontWeight.normal,
                color: colors.text.secondary,
                fontSize: typography.fontSize.xs,
              }}
            >
              {email}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => nav.push(`/${countryId}/account`)}>
          <IconUserCircle size={16} />
          My account
        </DropdownMenuItem>
        {showOrganization && (
          <DropdownMenuItem onSelect={() => nav.push(organizationUsersPath(countryId))}>
            <IconBuilding size={16} />
            My organization
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => auth.signOut()}>
          <IconLogout size={16} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
