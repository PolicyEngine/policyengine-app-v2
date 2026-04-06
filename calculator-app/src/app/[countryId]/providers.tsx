"use client";

import { useEffect } from "react";
import { QueryNormalizerProvider } from "@normy/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider, useDispatch } from "react-redux";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { CalcOrchestratorProvider } from "@/contexts/CalcOrchestratorContext";
import { useCurrentCountry } from "@/hooks/useCurrentCountry";
import { useFetchMetadata } from "@/hooks/useMetadata";
import { setCurrentCountry } from "@/reducers/metadataReducer";
import { AppDispatch, store } from "@/store";
import { cacheMonitor } from "@/utils/cacheMonitor";
import { perfMount } from "@/utils/perfHarness";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

cacheMonitor.init(queryClient);

/**
 * Same provider tree as CalculatorApp, minus the router.
 * Used by extracted Next.js route pages so that shared hooks
 * (Redux, React Query, etc.) work identically.
 */
export function CalculatorProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // [PERF HARNESS] Track mount/unmount lifecycle
  useEffect(() => perfMount('CalculatorProviders'), []);

  return (
    <AppProvider mode="calculator">
      <Provider store={store}>
        <QueryNormalizerProvider
          queryClient={queryClient}
          normalizerConfig={{
            devLogging: import.meta.env.DEV,
          }}
        >
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <CalcOrchestratorProvider>
                <MetadataBootstrap>{children}</MetadataBootstrap>
              </CalcOrchestratorProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </QueryNormalizerProvider>
      </Provider>
    </AppProvider>
  );
}

/**
 * Syncs the country to Redux and triggers a non-blocking metadata fetch,
 * mirroring CountryGuard + MetadataLazyLoader from the React Router tree.
 */
function MetadataBootstrap({ children }: { children: React.ReactNode }) {
  const countryId = useCurrentCountry();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(setCurrentCountry(countryId));
  }, [countryId, dispatch]);

  useFetchMetadata(countryId);

  return <>{children}</>;
}
