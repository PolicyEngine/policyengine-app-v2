"use client";

import StandardLayout from "@/components/StandardLayout";

/**
 * Layout for pathway create pages — also renders StandardLayout
 * but pathway wrappers can toggle sidebar visibility via
 * LayoutVisibilityContext for full-screen views (parameter selector).
 */
export default function PathwayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StandardLayout>{children}</StandardLayout>;
}
