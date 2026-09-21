"use client";

import { useMemo } from "react";
import {
  NavigationProvider,
  useAppNavigate,
} from "@/contexts/NavigationContext";
import { useAppPathname } from "@/contexts/LocationContext";
import AskPage from "@/pages/flagship/Ask.page";
import BuildPage from "@/pages/flagship/Build.page";
import ReformsPage from "@/pages/flagship/Reforms.page";
import StandardLayout from "@/components/StandardLayout";
import FlagshipGate from "./FlagshipGate";
import { isWorkspaceTransition, workspaceRoute } from "./workspaceRoutes";

const screens = { ask: AskPage, build: BuildPage, reforms: ReformsPage };

/** Switch client-only workspace screens without waiting for a server route payload.
 * Next's native history integration updates pathname/search and preserves back/forward.
 * Report routes, country switches, and legacy screens still use the normal router.
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
  const route = workspaceRoute(pathname);
  const Screen = route ? screens[route.screen as keyof typeof screens] : null;

  return (
    <NavigationProvider value={navigation}>
      <StandardLayout>
        {Screen ? (
          <FlagshipGate>
            <Screen />
          </FlagshipGate>
        ) : (
          children
        )}
      </StandardLayout>
    </NavigationProvider>
  );
}
