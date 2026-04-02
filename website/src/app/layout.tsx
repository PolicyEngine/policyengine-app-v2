import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://policyengine.org"),
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
        }}
      >
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
