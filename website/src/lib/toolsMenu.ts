import appsData from "@/data/apps.json";

/**
 * The header's Tools menu and the homepage's tools section.
 *
 * A tool works for any household under current law. Interactive research
 * about one policy, bill or event (the OBBBA explorer, the bill tracker,
 * reform calculators) is not a tool, however interactive it is. apps.json
 * marks each tool with a `toolsMenu` label, and the calculator's header reads
 * the same entries (app/src/utils/toolsMenu.ts). Each tool is its own zone at
 * `/<country>/<slug>` (see appZoneRoutes.ts), so links to one need a full page
 * load rather than next/link.
 */
export interface ToolLink {
  /** The apps.json slug, or MAIN_APP_ID for the main app. */
  id: string;
  label: string;
  description: string;
  href: string;
}

interface AppEntry {
  slug: string;
  countryId: string;
  description: string;
  toolsMenu?: { label: string };
}

export const CALCULATOR_URL =
  process.env.NEXT_PUBLIC_CALCULATOR_URL || "https://app.policyengine.org";

export const MAIN_APP_ID = "app";
export const MAIN_APP_LABEL = "PolicyEngine app";
const MAIN_APP_DESCRIPTION =
  "Build a tax or benefit reform and see its budgetary and distributional impacts.";

/** The main app (the calculator) for a country. */
export function getMainAppHref(countryId: string): string {
  return `${CALCULATOR_URL}/${countryId}`;
}

/** A country's tools, sorted by label. */
export function getTools(countryId: string): ToolLink[] {
  return (appsData as AppEntry[])
    .filter((app) => app.countryId === countryId && app.toolsMenu)
    .map((app) => ({
      id: app.slug,
      label: app.toolsMenu!.label,
      description: app.description,
      href: `/${countryId}/${app.slug}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
}

/**
 * The main app, then the country's tools. A country with no tools gets no
 * menu, so the main app never stands alone in one.
 */
export function getToolsMenu(countryId: string): ToolLink[] {
  const tools = getTools(countryId);
  if (tools.length === 0) return [];
  return [
    {
      id: MAIN_APP_ID,
      label: MAIN_APP_LABEL,
      description: MAIN_APP_DESCRIPTION,
      href: getMainAppHref(countryId),
    },
    ...tools,
  ];
}
