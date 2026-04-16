import appsData from "@/data/apps.json";

export type RecommendationKind = "iframe" | "rewrite" | "multizone";
export type InventoryOrigin = "apps.json" | "route";

export interface RoutingInventoryRow {
  id: string;
  origin: InventoryOrigin;
  title: string;
  slug: string;
  country: string;
  path: string;
  currentSetup: string;
  recommendedSetup: string;
  recommendationKind: RecommendationKind;
  framework: string;
  deployed: string;
  source: string;
  notes: string;
}

interface AppEntry {
  type: string;
  slug: string;
  title: string;
  source: string;
  countryId: string;
  displayWithResearch?: boolean;
}

const MULTIZONE_CANDIDATES = new Set([
  "keep-your-pay-act",
  "oregon-kicker-refund",
  "working-parents-tax-relief-act",
  "watca",
]);

const DIRECT_REWRITE_SLUGS = new Set([
  "keep-your-pay-act",
  "oregon-kicker-refund",
  "working-parents-tax-relief-act",
  "watca",
  "state-legislative-tracker",
]);

const STATIC_SLUGS = new Set([
  "2025-year-in-review",
  "tanf-calculator",
  "uk-salary-sacrifice-tool",
  "obbba-household-explorer",
  "obbba-household-by-household",
  "obbba-scatter",
  "snap-district-map",
]);

function publicPath(app: AppEntry) {
  return `/${app.countryId}/${app.slug}`;
}

function deployedFromSource(source: string) {
  if (source.startsWith("/assets/")) return "PolicyEngine static asset";
  if (source.startsWith("/")) return "PolicyEngine route + rewrite";

  const hostname = new URL(source).hostname;
  if (hostname.endsWith("vercel.app")) return "Vercel";
  if (hostname === "policyengine.github.io") return "GitHub Pages";
  if (hostname.endsWith(".modal.run")) return "Modal";
  if (hostname.endsWith(".streamlit.app")) return "Streamlit Cloud";
  return hostname;
}

function frameworkFromApp(app: AppEntry) {
  if (app.source.includes("streamlit.app")) return "Streamlit";
  if (app.source.startsWith("/assets/")) return "Bundled static SPA";
  if (app.source.startsWith("/")) return "PolicyEngine/rewritten embed";
  if (app.source.includes("policyengine.github.io")) {
    return "Static site/SPAs on GitHub Pages";
  }
  if (MULTIZONE_CANDIDATES.has(app.slug)) {
    return "Likely Next.js/Vercel path app; verify owning repo";
  }
  if (app.source.includes("vercel.app")) {
    return "Unknown Vercel app; verify owning repo";
  }
  if (app.source.includes("modal.run")) {
    return "Modal app; framework unclear";
  }
  return "Unknown; verify owning repo";
}

function currentSetup(app: AppEntry) {
  if (app.slug === "california-wealth-tax") {
    return "Dedicated website page with iframe; embed path rewrites to Vercel";
  }
  if (DIRECT_REWRITE_SLUGS.has(app.slug)) {
    return "Direct rewrite/proxy for public path; apps.json fallback exists";
  }
  if (app.type === "obbba-iframe") {
    return "Specialized OBBBA iframe wrapper from apps.json";
  }
  if (app.source.startsWith("/assets/")) {
    return "Generic website iframe wrapper to local static asset";
  }
  return "Generic website iframe wrapper from apps.json";
}

function recommendationForApp(app: AppEntry): {
  label: string;
  kind: RecommendationKind;
  notes: string;
} {
  if (MULTIZONE_CANDIDATES.has(app.slug)) {
    return {
      label: "Multi-zone candidate",
      kind: "multizone",
      notes: "Durable policy calculator with first-party public path.",
    };
  }

  if (app.slug === "california-wealth-tax") {
    return {
      label: "Keep dedicated rewrite now; multizone if it grows beyond embed mode",
      kind: "rewrite",
      notes: "Has custom query syncing via SyncedAppIframe.",
    };
  }

  if (app.slug === "state-legislative-tracker") {
    return {
      label: "Keep direct rewrite/proxy; formalize if root assets keep leaking",
      kind: "rewrite",
      notes: "Has extra tracker asset rewrites today.",
    };
  }

  if (STATIC_SLUGS.has(app.slug)) {
    return {
      label: "Keep iframe/static hosting",
      kind: "iframe",
      notes: "Static hosting is appropriate unless route ownership requirements change.",
    };
  }

  if (!app.displayWithResearch) {
    return {
      label: "Keep iframe",
      kind: "iframe",
      notes: "Not shown in research listing.",
    };
  }

  if (app.source.includes("vercel.app")) {
    return {
      label: "Iframe now; simple rewrite if first-party URL needed",
      kind: "rewrite",
      notes: "Shown in research listing.",
    };
  }

  return {
    label: "Keep iframe",
    kind: "iframe",
    notes: app.displayWithResearch ? "Shown in research listing." : "Not shown in research listing.",
  };
}

const EXTRA_ROWS: RoutingInventoryRow[] = [
  {
    id: "route:ads-dashboard",
    origin: "route",
    title: "PolicyEngine ads transparency dashboard",
    slug: "ads-dashboard",
    country: "us",
    path: "/us/ads-dashboard",
    currentSetup: "Dedicated website iframe page",
    recommendedSetup: "Keep iframe",
    recommendationKind: "iframe",
    framework: "Unknown Vercel app; verify owning repo",
    deployed: "Vercel",
    source: "https://policyengine-ads-dashboard.vercel.app?embedded=true",
    notes: "Route exists outside apps.json.",
  },
  {
    id: "route:ai-inequality",
    origin: "route",
    title: "AI and inequality",
    slug: "ai-inequality",
    country: "global",
    path: "/:countryId/ai-inequality",
    currentSetup: "Dedicated website iframe page",
    recommendedSetup: "Keep iframe unless it becomes a product surface",
    recommendationKind: "iframe",
    framework: "Unknown Vercel app; verify owning repo",
    deployed: "Vercel",
    source: "https://ai-inequality-theta.vercel.app",
    notes: "Country is passed as a query parameter for non-US.",
  },
  {
    id: "route:model",
    origin: "route",
    title: "PolicyEngine model documentation",
    slug: "model",
    country: "global",
    path: "/:countryId/model",
    currentSetup: "afterFiles rewrite to Vercel",
    recommendedSetup: "Simple rewrite is fine; multizone if docs need owned assets/routes",
    recommendationKind: "rewrite",
    framework: "Unknown Vercel docs app; verify owning repo",
    deployed: "Vercel",
    source: "https://policyengine-model-phi.vercel.app/",
    notes: "Rewrite injects country query.",
  },
  {
    id: "route:api",
    origin: "route",
    title: "Household API docs",
    slug: "api",
    country: "us",
    path: "/us/api",
    currentSetup: "beforeFiles rewrite plus scoped _zones asset proxy",
    recommendedSetup: "Already closest to multi-zone; keep formal zone asset prefix",
    recommendationKind: "multizone",
    framework: "Likely Next.js/Vercel docs app with assetPrefix",
    deployed: "Vercel",
    source: "https://household-api-docs-policy-engine.vercel.app/us/api/",
    notes: "Uses /_zones/household-api-docs asset proxy.",
  },
  {
    id: "route:taxsim",
    origin: "route",
    title: "TAXSIM emulator",
    slug: "taxsim",
    country: "us",
    path: "/us/taxsim",
    currentSetup: "afterFiles rewrite to Vercel",
    recommendedSetup: "Simple rewrite now; multizone if it becomes a durable app shell",
    recommendationKind: "rewrite",
    framework: "Unknown Vercel app; verify owning repo",
    deployed: "Vercel",
    source: "https://policyengine-taxsim-policy-engine.vercel.app/us/taxsim",
    notes: "Rewrite-only surface; not listed in apps.json.",
  },
  {
    id: "route:slides",
    origin: "route",
    title: "PolicyEngine slides",
    slug: "slides",
    country: "global",
    path: "/slides",
    currentSetup: "afterFiles rewrite to Vercel",
    recommendedSetup: "Keep simple rewrite",
    recommendationKind: "rewrite",
    framework: "Unknown Vercel app; verify owning repo",
    deployed: "Vercel",
    source: "https://policyengine-slides.vercel.app/slides",
    notes: "Utility surface outside country route tree.",
  },
  {
    id: "route:plugin-blog",
    origin: "route",
    title: "Plugin blog",
    slug: "plugin-blog",
    country: "global",
    path: "/plugin-blog",
    currentSetup: "afterFiles rewrite to GitHub Pages",
    recommendedSetup: "Keep simple rewrite/static hosting",
    recommendationKind: "iframe",
    framework: "Static site on GitHub Pages",
    deployed: "GitHub Pages",
    source: "https://policyengine.github.io/plugin-blog/",
    notes: "Static content surface rather than calculator app.",
  },
];

export function getRoutingInventoryRows(): RoutingInventoryRow[] {
  const appRows = (appsData as AppEntry[]).map((app) => {
    const recommendation = recommendationForApp(app);
    return {
      id: `app:${app.countryId}:${app.slug}`,
      origin: "apps.json" as const,
      title: app.title,
      slug: app.slug,
      country: app.countryId,
      path: publicPath(app),
      currentSetup: currentSetup(app),
      recommendedSetup: recommendation.label,
      recommendationKind: recommendation.kind,
      framework: frameworkFromApp(app),
      deployed: deployedFromSource(app.source),
      source: app.source,
      notes: recommendation.notes,
    };
  });

  return [...appRows, ...EXTRA_ROWS];
}
