import type { ReactNode } from 'react';
import { useUserType } from '@/hooks/useUserType';
import { userTypeMeetsMinimum, type UserType } from '@/types/v2User';

interface MinimumUserTypeProps {
  /** The lowest user type that sees `children`. */
  minimum: UserType;
  /** Shown instead of `children` to a user whose type is known and below `minimum`. Nothing by default. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Shows `children` only to users whose type is `minimum` or above it, as
 * `useUserType` reads it, and `fallback` to users whose type is below it.
 * While a signed-in user's type is not known yet (`GET /v2/me` is pending,
 * or failed without an answer) it shows nothing: neither `children` nor
 * `fallback`.
 *
 * On the sign-in callback route (`/{country}/callback`) it shows nothing
 * and sends no `GET /v2/me` (see `useIsSignInCallback`): on a first
 * sign-in that request, racing `POST /v2/me/upgrade`, can create the
 * account first, so the upgrade would merge this browser's
 * unauthenticated user into that new account instead of converting it.
 */
export default function MinimumUserType({
  minimum,
  fallback = null,
  children,
}: MinimumUserTypeProps) {
  const userType = useUserType();
  if (userType === null) {
    return null;
  }
  return <>{userTypeMeetsMinimum(userType, minimum) ? children : fallback}</>;
}
