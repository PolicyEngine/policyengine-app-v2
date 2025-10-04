import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/api/v2/users';
import { MOCK_USER_ID } from '@/constants';

/**
 * Hook to get the current user's selected model.
 * Returns the model_id (e.g., 'policyengine_uk', 'policyengine_us')
 */
export function useCurrentModel() {
  const userId = import.meta.env.DEV ? MOCK_USER_ID : 'dev_test';

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => usersAPI.getUser(userId),
  });

  return {
    modelId: user?.current_model_id || 'policyengine_uk',
    isLoading,
    error,
  };
}
