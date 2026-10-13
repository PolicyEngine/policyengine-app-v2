"use client";

import AccountImportNotice from "@/components/auth/AccountImportNotice";
import { AuthProvider } from "@/libs/auth/AuthProvider";
import WorkspaceNavigation from "./WorkspaceNavigation";

/**
 * Flagship workspace shell. Kept in its own route group so the local
 * screen switching never wraps the legacy calculator routes.
 *
 * Sign-in belongs to the workspace alone: the legacy calculator routes
 * have no AuthProvider and keep saved work in the browser. The provider
 * is inert unless NEXT_PUBLIC_AUTH_ENABLED=true and Auth0 is configured.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <WorkspaceNavigation>{children}</WorkspaceNavigation>
      <AccountImportNotice />
      <div id="fullscreen-portal" />
    </AuthProvider>
  );
}
