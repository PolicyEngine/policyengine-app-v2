// Next.js calls register() once when a server instance starts, before it
// handles a request.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Route handlers under src/app/api call other hosts over HTTPS; see
    // app/src/libs/removeCompromisedEmudhraRoots.ts.
    const { removeCompromisedEmudhraRoots } =
      await import("@/libs/removeCompromisedEmudhraRoots");
    removeCompromisedEmudhraRoots();
  }
}
