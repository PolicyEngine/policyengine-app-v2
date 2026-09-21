"use client";

import WorkspaceNavigation from "./WorkspaceNavigation";

/**
 * Shared calculator shell for extracted calculator routes.
 * Keeps the calculator visual shell mounted across calculator navigation.
 */
export default function CalculatorLayout({
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
