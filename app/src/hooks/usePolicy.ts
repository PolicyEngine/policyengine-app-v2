import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { fetchPolicyById } from '@/api/policy';
import { RootState } from '@/store';

/* TODO Integrate hook for get user policies api */
export function usePolicy(country?: string, policyId = '88713') {
  // Get country from metadata state, fallback to 'us' if not provided
  const metadataCountry = useSelector((state: RootState) => state.metadata.currentCountry);
  const resolvedCountry = country || metadataCountry || 'us';
  // hardcoded a default value until user policies integrated
  return useQuery({
    queryKey: ['policy', resolvedCountry, policyId],
    queryFn: () => fetchPolicyById(resolvedCountry, policyId),
  });
}
