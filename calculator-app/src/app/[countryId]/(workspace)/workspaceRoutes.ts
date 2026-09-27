type WorkspaceRoute =
  | { country: string; screen: "ask" | "build" | "reforms" }
  | { country: string; screen: "bill" | "report"; id: string };

/** Only these client-only screens are rendered locally by WorkspaceNavigation. */
export function workspaceRoute(path: string): WorkspaceRoute | null {
  const match = /^\/(us|uk)\/(ask|build|reforms)\/?(?:[?#].*)?$/.exec(path);
  if (match) {
    return {
      country: match[1],
      screen: match[2] as "ask" | "build" | "reforms",
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
