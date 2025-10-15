import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { fetchPolicyById } from '@/api/policy';
import { selectCurrentCountry } from '@/reducers/metadataReducer';

/* TODO Integrate hook for get user policies api */
export function usePolicy(country?: string, policyId = '88713') {
  // Get country from metadata state
  const metadataCountry = useSelector(selectCurrentCountry);
  const resolvedCountry = country || metadataCountry!;
  // hardcoded a default value until user policies integrated
  return useQuery({
    queryKey: ['policy', resolvedCountry, policyId],
    queryFn: () => fetchPolicyById(resolvedCountry, policyId),
  });
}
