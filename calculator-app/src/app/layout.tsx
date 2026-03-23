import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolicyEngine Calculator",
  description:
    "Calculate your taxes and benefits, create policy simulations, and analyze reform impacts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
