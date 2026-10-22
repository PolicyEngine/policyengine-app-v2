// Next.js calls register() once when a server instance starts, before it
// handles a request.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Route handlers such as /api/betterstack call other hosts over HTTPS;
    // see src/lib/removeCompromisedEmudhraRoots.ts.
    const { removeCompromisedEmudhraRoots } =
      await import("@/lib/removeCompromisedEmudhraRoots");
    removeCompromisedEmudhraRoots();
  }
}
