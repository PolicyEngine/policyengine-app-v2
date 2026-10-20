type WorkspaceRoute =
  | { country: string; screen: "build" | "reforms" }
  | { country: string; screen: "bill" | "report"; id: string };

/** Only these client-only screens are rendered locally by WorkspaceNavigation. */
export function workspaceRoute(path: string): WorkspaceRoute | null {
  const match = /^\/(us|uk)\/(build|reforms)\/?(?:[?#].*)?$/.exec(path);
  if (match) {
    return {
      country: match[1],
      screen: match[2] as "build" | "reforms",
    };
  }
  const report =
    /^\/(us|uk)\/report\/(bill\/)?([a-zA-Z0-9_-]+)\/?(?:[?#].*)?$/.exec(path);
  if (!report || (!report[2] && report[3] === "bill")) return null;
  return {
    country: report[1],
    screen: report[2] ? "bill" : "report",
    id: report[3],
  };
}

export function isWorkspaceTransition(from: string, to: string) {
  const current = workspaceRoute(from);
  const next = workspaceRoute(to);
  return !!current && !!next && current.country === next.country;
}

/** A path without its query, hash or trailing slash. */
function pathOnly(path: string) {
  return path.replace(/[?#].*$/, "").replace(/(.)\/$/, "$1");
}

/**
 * Whether a move stays on the same screen and changes only its query or
 * hash, such as opening a report section. The page then keeps its scroll
 * position rather than starting at the top.
 */
export function isSameScreen(from: string, to: string) {
  return pathOnly(from) === pathOnly(to);
}
