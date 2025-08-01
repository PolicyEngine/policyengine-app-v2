import { useQuery } from '@tanstack/react-query';
import { simulationKeys } from '@/libs/queryKeys';
import { fetchSimulationById } from '@/api/simulation';

export const useUserSimulations = (userId: string) => {
  return useQuery(simulationKeys.byUser(userId), () => fetchSimulationById('us', userId));
};
