// Configuration for Tanstack Query when working with particular
// external data stores
export const queryConfig = {
  api: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  },
  localStorage: {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 0,
  },
} as const;
