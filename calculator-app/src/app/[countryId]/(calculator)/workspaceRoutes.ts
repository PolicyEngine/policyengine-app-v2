/** Only these screens are rendered locally by WorkspaceNavigation. */
export function workspaceRoute(path: string) {
  const match = /^\/(us|uk)\/(ask|build|reforms)\/?(?:[?#].*)?$/.exec(path);
  return match ? { country: match[1], screen: match[2] } : null;
}

export function isWorkspaceTransition(from: string, to: string) {
  const current = workspaceRoute(from);
  const next = workspaceRoute(to);
  return !!current && !!next && current.country === next.country;
}
