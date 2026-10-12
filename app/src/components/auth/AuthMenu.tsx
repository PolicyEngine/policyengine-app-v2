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

/** The name or email to show for the signed-in user. */
export function accountDisplayName(auth: Pick<AuthContextValue, 'user' | 'profile'>): string {
  const fullName = [auth.user?.first_name, auth.user?.last_name].filter(Boolean).join(' ');
  return fullName || auth.profile?.name || auth.user?.email || auth.profile?.email || 'Account';
}

function initialOf(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

/**
 * Header control for sign-in: a "Sign in" button when signed out, the
 * user menu (My account, Sign out) when signed in, and nothing when
 * sign-in is disabled or the session is still being restored.
 */
export default function AuthMenu({ variant = 'default' }: AuthMenuProps) {
  const auth = useAuthStatus();
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();
  const inverse = variant === 'inverse';

  if (auth.status === 'disabled' || auth.status === 'loading') {
    return null;
  }

  if (auth.status === 'anonymous') {
    return (
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
    );
  }

  const name = accountDisplayName(auth);
  const email = auth.user?.email ?? auth.profile?.email;

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
