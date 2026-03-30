/**
 * Post data transformers for the Next.js website.
 * Processes raw posts.json to generate slugs, extract tags, and create label mappings.
 */

import postsData from "./posts.json";
import appsData from "@/data/apps.json";
import type { BlogPost } from "@/types/blog";

export type { BlogPost };

export interface ResearchItem {
  title: string;
  description: string;
  date: string;
  authors: string[];
  tags: string[];
  image: string;
  slug: string;
  isApp: boolean;
  countryId: string;
}

export type TagLabels = Record<string, string>;

const COUNTRY_IDS = ["us", "uk", "ng", "ca", "global"] as const;

// Lazy-initialized processed data
let _postsSorted: BlogPost[] | null = null;
let _locationTags: string[] | null = null;
let _topicTags: string[] | null = null;

function initPosts() {
  if (_postsSorted) return;

  _postsSorted = [...(postsData as BlogPost[])].sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );

  for (const post of _postsSorted) {
    const filenameWithoutExt = post.filename.substring(
      0,
      post.filename.indexOf("."),
    );
    post.slug = filenameWithoutExt.toLowerCase().replace(/_/g, "-");
  }

  const allTags = [...new Set(_postsSorted.flatMap((p) => p.tags))].sort();

  _locationTags = allTags.filter((tag) =>
    COUNTRY_IDS.some(
      (countryId) => tag.startsWith(`${countryId}-`) || tag === countryId,
    ),
  );

  _topicTags = allTags.filter((tag) => !_locationTags!.includes(tag)).sort();
}

export function getPostsSorted(): BlogPost[] {
  initPosts();
  return _postsSorted!;
}

export function getLocationTags(): string[] {
  initPosts();
  return _locationTags!;
}

export function getTopicTags(): string[] {
  initPosts();
  return _topicTags!;
}

// Topic labels
export const topicLabels: TagLabels = {
  featured: "Featured",
  impact: "Impact",
  policy: "Policy analysis",
  technical: "Technical report",
  api: "API",
  "benefit-access": "Benefit access",
  reconciliation: "Reconciliation",
  "2024-election": "2024 Election",
  ai: "AI",
  "april-fools": "April Fools",
  "autumn-budget": "Autumn Budget",
  "behavioral-responses": "Behavioral responses",
  benefit: "Benefits",
  "child-tax-credit": "Child Tax Credit",
  conferences: "Conferences",
  data: "Data",
  "donald-trump": "Donald Trump",
  election: "Election",
  event: "Events",
  giving: "Giving",
  healthcare: "Healthcare",
  inflation: "Inflation",
  interactives: "Interactives",
  "kamala-harris": "Kamala Harris",
  louisiana: "Louisiana",
  minnesota: "Minnesota",
  org: "Organization",
  tariffs: "Tariffs",
  tax: "Tax",
  technology: "Technology",
  vat: "VAT",
  "year-in-review": "Year in review",
};

const countryVariantTags: Record<string, Record<string, string>> = {
  "behavioral-responses": {
    uk: "Behavioural responses",
    default: "Behavioral responses",
  },
  org: {
    uk: "Organisation",
    default: "Organization",
  },
};

export function getTopicLabel(tag: string, countryId: string): string {
  const variants = countryVariantTags[tag];
  if (variants) {
    return variants[countryId] || variants.default;
  }
  return topicLabels[tag] || tag;
}

// Location labels
export const locationLabels: TagLabels = {
  ca: "Canada",
  us: "United States",
  uk: "United Kingdom",
  global: "Global",
  ng: "Nigeria",
  "us-dc": "District of Columbia",
  "us-ak": "Alaska",
  "us-al": "Alabama",
  "us-ar": "Arkansas",
  "us-az": "Arizona",
  "us-ca": "California",
  "us-co": "Colorado",
  "us-ct": "Connecticut",
  "us-de": "Delaware",
  "us-fl": "Florida",
  "us-ga": "Georgia",
  "us-hi": "Hawaii",
  "us-ia": "Iowa",
  "us-id": "Idaho",
  "us-il": "Illinois",
  "us-in": "Indiana",
  "us-ks": "Kansas",
  "us-ky": "Kentucky",
  "us-la": "Louisiana",
  "us-ma": "Massachusetts",
  "us-md": "Maryland",
  "us-me": "Maine",
  "us-mi": "Michigan",
  "us-mn": "Minnesota",
  "us-mo": "Missouri",
  "us-ms": "Mississippi",
  "us-mt": "Montana",
  "us-nc": "North Carolina",
  "us-nd": "North Dakota",
  "us-ne": "Nebraska",
  "us-nh": "New Hampshire",
  "us-nj": "New Jersey",
  "us-nm": "New Mexico",
  "us-nv": "Nevada",
  "us-ny": "New York",
  "us-ny-nyc": "New York City",
  "us-oh": "Ohio",
  "us-ok": "Oklahoma",
  "us-or": "Oregon",
  "us-pa": "Pennsylvania",
  "us-ri": "Rhode Island",
  "us-sc": "South Carolina",
  "us-sd": "South Dakota",
  "us-tn": "Tennessee",
  "us-tx": "Texas",
  "us-ut": "Utah",
  "us-va": "Virginia",
  "us-vt": "Vermont",
  "us-wa": "Washington",
  "us-wi": "Wisconsin",
  "us-wv": "West Virginia",
  "us-wy": "Wyoming",
};

/**
 * Get combined research items (posts + apps with displayWithResearch)
 * sorted by date (newest first)
 */
export function getResearchItems(): ResearchItem[] {
  const postItems: ResearchItem[] = getPostsSorted().map((post) => ({
    title: post.title,
    description: post.description,
    date: post.date,
    authors: post.authors,
    tags: post.tags,
    image: post.image,
    slug: post.slug,
    isApp: false,
    countryId:
      post.tags.find((tag) => ["us", "uk", "ca", "ng"].includes(tag)) || "us",
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apps = appsData as any[];
  const appItems: ResearchItem[] = apps
    .filter((app) => app.displayWithResearch)
    .map((app) => ({
      title: app.title,
      description: app.description,
      date: app.date || "1970-01-01",
      authors: app.authors || [],
      tags: app.tags,
      image: app.image || "",
      slug: app.slug,
      isApp: true,
      countryId: app.countryId,
    }));

  return [...postItems, ...appItems].sort((a, b) => (a.date < b.date ? 1 : -1));
}
