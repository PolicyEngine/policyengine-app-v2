import { useQuery } from '@tanstack/react-query';
import { fetchPolicyById } from '@/api/policy';

export function usePolicy(country = 'us', policyId = '2') {
  return useQuery({
    queryKey: ['policy', country, policyId],
    queryFn: () => fetchPolicyById(country, policyId),
  });
}
