import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | PolicyEngine",
    default: "PolicyEngine",
  },
  description:
    "Free, open-source tools to understand tax and benefit policies. Calculate your taxes and benefits, or analyze policy reforms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
