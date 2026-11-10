import { useUserType } from '@/hooks/useUserType';

/** Shows the type `useUserType` reads, so a test can wait until /v2/me has answered. */
export function UserTypeProbe() {
  return <p>User type: {useUserType()}</p>;
}
