/**
 * Post Data Transformers
 *
 * Processes raw posts.json data to generate slugs, extract tags,
 * and create label mappings for filtering and display.
 *
 * This file maintains the exact logic from the old app's postTransformers.js
 */

import { apps } from '@/data/apps/appTransformers';
import type { BlogPost, ResearchItem, TagLabels } from '@/types/blog';
import postsData from './posts.json';

// Type assertion for imported JSON (Vite handles this)
const postsRaw = postsData as BlogPost[];

// Lazy-initialized processed data — deferred until first access to avoid
// blocking app startup with sorting/slug-generation for all blog posts
let _postsSorted: BlogPost[] | null = null;
let _uniqueTags: string[] | null = null;
let _locationTags: string[] | null = null;
let _topicTags: string[] | null = null;

const COUNTRY_IDS = ['us', 'uk', 'ng', 'ca', 'global'] as const;

function initPosts() {
  if (_postsSorted) {
    return;
  }

  _postsSorted = [...postsRaw].sort((a, b) => (a.date < b.date ? 1 : -1));

  for (const post of _postsSorted) {
    const filenameWithoutExt = post.filename.substring(0, post.filename.indexOf('.'));
    post.slug = filenameWithoutExt.toLowerCase().replace(/_/g, '-');
  }

  const tags = _postsSorted.map((post) => post.tags);
  _uniqueTags = [...new Set(tags.flat())].sort();

  _locationTags = _uniqueTags.filter((tag) =>
    COUNTRY_IDS.some((countryId) => tag.startsWith(`${countryId}-`) || tag === countryId)
  );

  _topicTags = _uniqueTags.filter((tag) => !_locationTags!.includes(tag)).sort();
}

function getPostsSorted(): BlogPost[] {
  initPosts();
  return _postsSorted!;
}

function getUniqueTags(): string[] {
  initPosts();
  return _uniqueTags!;
}

function getLocationTags(): string[] {
  initPosts();
  return _locationTags!;
}

function getTopicTags(): string[] {
  initPosts();
  return _topicTags!;
}

// Topic labels for display (base labels - use getTopicLabel for country-specific spelling)
const topicLabels: TagLabels = {
  featured: 'Featured',
  impact: 'Impact',
  policy: 'Policy analysis',
  technical: 'Technical report',
  api: 'API',
  'benefit-access': 'Benefit access',
  reconciliation: 'Reconciliation',
  '2024-election': '2024 Election',
  ai: 'AI',
  'april-fools': 'April Fools',
  'autumn-budget': 'Autumn Budget',
  'behavioral-responses': 'Behavioral responses', // UK variant: Behavioural responses
  benefit: 'Benefits',
  'child-tax-credit': 'Child Tax Credit',
  conferences: 'Conferences',
  data: 'Data',
  'donald-trump': 'Donald Trump',
  election: 'Election',
  event: 'Events',
  giving: 'Giving',
  healthcare: 'Healthcare',
  inflation: 'Inflation',
  interactives: 'Interactives',
  'kamala-harris': 'Kamala Harris',
  louisiana: 'Louisiana',
  minnesota: 'Minnesota',
  org: 'Organization', // UK variant: Organisation
  tariffs: 'Tariffs',
  tax: 'Tax',
  technology: 'Technology',
  vat: 'VAT',
  'year-in-review': 'Year in review',
};

// Tags with country-specific spelling variants
// Maps internal tag to country-specific display labels
const countryVariantTags: Record<string, Record<string, string>> = {
  'behavioral-responses': {
    uk: 'Behavioural responses',
    default: 'Behavioral responses',
  },
  org: {
    uk: 'Organisation',
    default: 'Organization',
  },
};

/**
 * Get topic label with country-specific spelling
 * UK uses British spelling (behavioural, organisation)
 * US/other uses American spelling (behavioral, organization)
 */
export function getTopicLabel(tag: string, countryId: string): string {
  // Check if this tag has country-specific variants
  const variants = countryVariantTags[tag];
  if (variants) {
    return variants[countryId] || variants.default;
  }

  // Fall back to base label
  const baseLabel = topicLabels[tag];
  return baseLabel || tag;
}

// Location labels for display (all US states + countries)
const locationLabels: TagLabels = {
  ca: 'Canada',
  us: 'United States',
  uk: 'United Kingdom',
  global: 'Global',
  ng: 'Nigeria',
  'us-dc': 'District of Columbia',
  'us-ak': 'Alaska',
  'us-al': 'Alabama',
  'us-ar': 'Arkansas',
  'us-az': 'Arizona',
  'us-ca': 'California',
  'us-co': 'Colorado',
  'us-ct': 'Connecticut',
  'us-de': 'Delaware',
  'us-fl': 'Florida',
  'us-ga': 'Georgia',
  'us-hi': 'Hawaii',
  'us-ia': 'Iowa',
  'us-id': 'Idaho',
  'us-il': 'Illinois',
  'us-in': 'Indiana',
  'us-ks': 'Kansas',
  'us-ky': 'Kentucky',
  'us-la': 'Louisiana',
  'us-ma': 'Massachusetts',
  'us-md': 'Maryland',
  'us-me': 'Maine',
  'us-mi': 'Michigan',
  'us-mn': 'Minnesota',
  'us-mo': 'Missouri',
  'us-ms': 'Mississippi',
  'us-mt': 'Montana',
  'us-nc': 'North Carolina',
  'us-nd': 'North Dakota',
  'us-ne': 'Nebraska',
  'us-nh': 'New Hampshire',
  'us-nj': 'New Jersey',
  'us-nm': 'New Mexico',
  'us-nv': 'Nevada',
  'us-ny': 'New York',
  'us-ny-nyc': 'New York City',
  'us-oh': 'Ohio',
  'us-ok': 'Oklahoma',
  'us-or': 'Oregon',
  'us-pa': 'Pennsylvania',
  'us-ri': 'Rhode Island',
  'us-sc': 'South Carolina',
  'us-sd': 'South Dakota',
  'us-tn': 'Tennessee',
  'us-tx': 'Texas',
  'us-ut': 'Utah',
  'us-va': 'Virginia',
  'us-vt': 'Vermont',
  'us-wa': 'Washington',
  'us-wi': 'Wisconsin',
  'us-wv': 'West Virginia',
  'us-wy': 'Wyoming',
};

/**
 * Get combined research items (posts + apps with displayWithResearch)
 * sorted by date (newest first)
 */
export function getResearchItems(): ResearchItem[] {
  // Convert posts to ResearchItem format
  const postItems: ResearchItem[] = getPostsSorted().map((post) => ({
    title: post.title,
    description: post.description,
    date: post.date,
    authors: post.authors,
    tags: post.tags,
    image: post.image,
    slug: post.slug,
    isApp: false,
    // Determine country from tags
    countryId: post.tags.find((tag) => ['us', 'uk', 'ca', 'ng'].includes(tag)) || 'us',
  }));

  // Get apps with displayWithResearch: true and convert to ResearchItem format
  const appItems: ResearchItem[] = apps
    .filter((app) => app.displayWithResearch)
    .map((app) => ({
      title: app.title,
      description: app.description,
      date: app.date || '1970-01-01', // fallback for sorting
      authors: app.authors || [],
      tags: app.tags,
      image: app.image || '',
      slug: app.slug,
      isApp: true,
      countryId: app.countryId,
    }));

  // Combine and sort by date (newest first)
  return [...postItems, ...appItems].sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Export processed data (lazy — initialized on first call)
export {
  getPostsSorted as getPosts,
  getLocationTags,
  getUniqueTags,
  getTopicTags,
  locationLabels,
  topicLabels,
};

// Export default for convenience
export default {
  getPosts: getPostsSorted,
  getLocationTags,
  getUniqueTags,
  getTopicTags,
  locationLabels,
  topicLabels,
  getResearchItems,
};
