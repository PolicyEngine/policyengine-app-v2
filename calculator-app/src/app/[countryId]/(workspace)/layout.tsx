"use client";

import WorkspaceNavigation from "./WorkspaceNavigation";

/**
 * Flagship workspace shell. Kept in its own route group so the local
 * screen switching never wraps the legacy calculator routes.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <WorkspaceNavigation>{children}</WorkspaceNavigation>
      <div id="fullscreen-portal" />
    </>
  );
}
