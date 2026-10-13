"use client";

import { useEffect, useState } from "react";
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
  // Construct the QueryClient inside component state so each browser tab
  // gets its own client (avoids cross-request pollution during SSR) and so
  // the client is never shared across React trees on navigation.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Five minutes is a reasonable default for calculator metadata:
            // long enough to avoid thrashing between route transitions,
            // short enough that stale reforms get refreshed on refocus.
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  // Initialise cache monitor as an effect so we don't run side effects during
  // render. It is safe to run every mount because `queryClient` is stable.
  useEffect(() => {
    cacheMonitor.init(queryClient);
  }, [queryClient]);

  return (
    <AppProvider mode="calculator">
      <Provider store={store}>
        <QueryNormalizerProvider
          queryClient={queryClient}
          normalizerConfig={{
            devLogging: process.env.NODE_ENV !== "production",
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
