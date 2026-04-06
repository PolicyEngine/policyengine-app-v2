"use client";

import StandardLayout from "@/components/StandardLayout";

/**
 * Layout for listing/standard pages — renders StandardLayout (sidebar + header).
 * Persists across all navigations within this route group.
 */
export default function WithSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StandardLayout>{children}</StandardLayout>;
}
