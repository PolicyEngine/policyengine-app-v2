import { useQuery } from '@tanstack/react-query';
import { fetchPolicyById } from '@/api/policy';
import { useCurrentCountry } from '@policyengine/shared';

/* TODO Integrate hook for get user policies api */
export function usePolicy(country?: string, policyId = '88713') {
  // Get country from hook or use provided country parameter
  const currentCountry = useCurrentCountry();
  const resolvedCountry = country || currentCountry;
  // hardcoded a default value until user policies integrated
  return useQuery({
    queryKey: ['policy', resolvedCountry, policyId],
    queryFn: () => fetchPolicyById(resolvedCountry, policyId),
  });
}
