/** Shared cache GC time — keeps data for 5 min after unmount so back-navigation is instant */
export const GC_TIME_5_MIN = 5 * 60 * 1000;

// Configuration for Tanstack Query when working with particular
// external data stores
export const queryConfig = {
  api: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  },
  localStorage: {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 0,
  },
} as const;
