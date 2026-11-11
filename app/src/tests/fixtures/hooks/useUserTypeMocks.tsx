import { useUserType } from '@/hooks/useUserType';

/**
 * Shows the type `useUserType` reads ("unknown" while it is null), so a test
 * can wait until /v2/me has answered.
 */
export function UserTypeProbe() {
  return <p>User type: {useUserType() ?? 'unknown'}</p>;
}
