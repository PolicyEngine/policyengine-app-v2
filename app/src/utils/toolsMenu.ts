// Relative, not '@/', so the website's tests can import this file and check it
// against their own copy (website/src/lib/toolsMenu.ts).
import appsData from '../data/apps/apps.json';

/**
 * The Tools menu shared with the website header. A tool works for any
 * household under current law; apps.json marks each one with a `toolsMenu`
 * label. The menu lists the main app first, then these.
 */
export interface ToolsMenuEntry {
  slug: string;
  label: string;
}

interface AppEntry {
  slug: string;
  countryId: string;
  toolsMenu?: { label: string };
}

export const MAIN_APP_LABEL = 'PolicyEngine app';

/** A country's tools, sorted by label. */
export function getToolsMenuEntries(countryId: string): ToolsMenuEntry[] {
  return (appsData as AppEntry[])
    .filter((app) => app.countryId === countryId && app.toolsMenu)
    .map((app) => ({ slug: app.slug, label: app.toolsMenu!.label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en'));
}
