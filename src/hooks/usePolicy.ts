import { useQuery } from '@tanstack/react-query';
import { fetchPolicyById } from '@/api/policy';

/* TODO Integrate hook for get user policies api */
export function usePolicy(country = 'us', policyId = '88713') { // hardcoded a default value until user policies integrated
  return useQuery({
    queryKey: ['policy', country, policyId],
    queryFn: () => fetchPolicyById(country, policyId),
  });
}
