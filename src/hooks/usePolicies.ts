import { useQuery } from '@tanstack/react-query';
import { mockPolicies } from '../mocks/mockPolicies';

async function fetchPolicies() {
  if (import.meta.env.DEV) {
    console.log('Returning mock policies...');
    return new Promise((res) => setTimeout(() => res(mockPolicies), 500));
  }
  const res = await fetch('/api/policies');
  if (!res.ok){
    throw new Error('Failed to fetch policies');
  }
  return res.json();
}

export function usePolicies() {
  return useQuery({
    queryKey: ['policies'],
    queryFn: fetchPolicies,
  });
}
