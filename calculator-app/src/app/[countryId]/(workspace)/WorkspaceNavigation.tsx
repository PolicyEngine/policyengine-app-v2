"use client";

import dynamic from "next/dynamic";
import BillReportPage from "@/pages/flagship/BillReport.page";
import { useMemo, useState } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import {
  NavigationProvider,
  useAppNavigate,
} from "@/contexts/NavigationContext";
import { useAppPathname } from "@/contexts/LocationContext";
import AskPage from "@/pages/flagship/Ask.page";
import BuildPage from "@/pages/flagship/Build.page";
import ReformsPage from "@/pages/flagship/Reforms.page";
import StandardLayout from "@/components/StandardLayout";
import WorkspaceError from "./error";
import FlagshipGate from "./FlagshipGate";
import { isWorkspaceTransition, workspaceRoute } from "./workspaceRoutes";

// Keep the browser-only chart stack out of SSR, as in the direct report route.
const ReportPage = dynamic(() => import("@/pages/flagship/Report.page"), {
  ssr: false,
});

const screens = { ask: AskPage, build: BuildPage, reforms: ReformsPage };

/** Switch client-only workspace screens without waiting for a server route payload.
 * Next's native history integration updates pathname/search and preserves back/forward.
 * Country switches and routes outside this group still use the normal router.
 */
export default function WorkspaceNavigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useAppNavigate();
  const pathname = useAppPathname();
  const navigation = useMemo(
    () => ({
      ...router,
      push: (path: string) => {
        if (isWorkspaceTransition(window.location.pathname, path)) {
          window.history.pushState(null, "", path);
          window.scrollTo(0, 0);
        } else {
          router.push(path);
        }
      },
      replace: (path: string) => {
        if (isWorkspaceTransition(window.location.pathname, path)) {
          window.history.replaceState(null, "", path);
        } else {
          router.replace(path);
        }
      },
    }),
    [router],
  );
  const [attempt, setAttempt] = useState(0);
  const route = workspaceRoute(pathname);
  let content = children;
  if (route) {
    if (route.screen === "bill") {
      content = <BillReportPage key={route.id} billId={route.id} />;
    } else if (route.screen === "report") {
      content = <ReportPage key={route.id} userReportId={route.id} />;
    } else {
      const Screen = screens[route.screen];
      content = <Screen />;
    }
  }

  return (
    <NavigationProvider value={navigation}>
      <StandardLayout>
        {route ? (
          <FlagshipGate>
            {/* Screens rendered here bypass the segment's error.tsx, which only wraps children. */}
            <ErrorBoundary
              key={`${pathname}:${attempt}`}
              fallback={(error) => (
                <WorkspaceError
                  error={error}
                  reset={() => setAttempt((count) => count + 1)}
                />
              )}
            >
              {content}
            </ErrorBoundary>
          </FlagshipGate>
        ) : (
          children
        )}
      </StandardLayout>
    </NavigationProvider>
  );
}
