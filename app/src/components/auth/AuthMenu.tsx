import { IconLogout, IconUserCircle } from '@tabler/icons-react';
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
import { useAuthStatus, type AuthContextValue } from '@/libs/auth/AuthContext';

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
 * Sign out) when signed in, and nothing when sign-in is disabled.
 */
export default function AuthMenu({ variant = 'default' }: AuthMenuProps) {
  const auth = useAuthStatus();
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();
  const inverse = variant === 'inverse';

  if (auth.status === 'disabled') {
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

  const name = accountDisplayName(auth);
  const email = auth.profile?.email;

  return (
    <DropdownMenu>
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
        <DropdownMenuItem onSelect={() => auth.signOut()}>
          <IconLogout size={16} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
