"use client";

import AccountUpgradeNotice from "@/components/auth/AccountUpgradeNotice";
import { AuthProvider } from "@/libs/auth/AuthProvider";
import WorkspaceNavigation from "./WorkspaceNavigation";

/**
 * Flagship workspace shell. Kept in its own route group so the local
 * screen switching never wraps the legacy calculator routes.
 *
 * Accounts belong to the workspace alone: the legacy calculator routes
 * have no AuthProvider and keep saved work in the browser. The provider
 * is inert unless NEXT_PUBLIC_AUTH_ENABLED=true and Auth0 is configured;
 * then saved work goes to the PolicyEngine API, signed in or not.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <WorkspaceNavigation>{children}</WorkspaceNavigation>
      <AccountUpgradeNotice />
      <div id="fullscreen-portal" />
    </AuthProvider>
  );
}
