import { ClientOnly } from "./client";

/**
 * Catch-all page that renders the entire calculator app client-side.
 *
 * This follows the official Next.js Vite migration guide:
 * https://nextjs.org/docs/app/guides/migrating/from-vite
 *
 * React Router handles all routing inside the client-only boundary.
 * In future PRs, individual routes can be extracted from the catch-all
 * into proper Next.js file-based routes for SSR/code-splitting benefits.
 */
export default function Page() {
  return <ClientOnly />;
}
