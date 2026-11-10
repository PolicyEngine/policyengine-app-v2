import type { ReactNode } from 'react';
import { useUserType } from '@/hooks/useUserType';
import { userTypeMeetsMinimum, type UserType } from '@/types/v2User';

interface MinimumUserTypeProps {
  /** The lowest user type that sees `children`. */
  minimum: UserType;
  /** Shown instead of `children` to every other user. Nothing by default. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Shows `children` only to users whose type is `minimum` or above it, as
 * `useUserType` reads it. While `GET /v2/me` is pending or has failed the
 * user counts as unauthenticated, so `children` never show before the
 * user's type is known.
 */
export default function MinimumUserType({
  minimum,
  fallback = null,
  children,
}: MinimumUserTypeProps) {
  const userType = useUserType();
  return <>{userTypeMeetsMinimum(userType, minimum) ? children : fallback}</>;
}
