/**
 * Post Data Transformers
 *
 * Processes raw posts.json data to generate slugs, extract tags,
 * and create label mappings for filtering and display.
 *
 * This file maintains the exact logic from the old app's postTransformers.js
 */

import type { BlogPost, TagLabels, ResearchItem } from '@/types/blog';
import type { App } from '@/types/apps';
import postsData from './posts.json';
import { apps } from '@/data/apps/appTransformers';

// Type assertion for imported JSON (Vite handles this)
const postsRaw = postsData as BlogPost[];

// Sort posts by date (newest first)
const postsSorted = [...postsRaw].sort((a, b) => (a.date < b.date ? 1 : -1));

// Generate slugs for all posts
for (const post of postsSorted) {
  // Extract slug from filename (remove extension)
  const filenameWithoutExt = post.filename.substring(0, post.filename.indexOf('.'));
  post.slug = filenameWithoutExt
    .toLowerCase()
    .replace(/_/g, '-'); // Replace underscores with hyphens
}

// Extract all tags from all posts
const tags = postsSorted.map((post) => post.tags);
const uniqueTags = [...new Set(tags.flat())].sort();

// Categorize tags into locations and topics
const COUNTRY_IDS = ['us', 'uk', 'ng', 'ca', 'global'] as const;

const locationTags = uniqueTags.filter((tag) =>
  COUNTRY_IDS.some((countryId) => tag.startsWith(countryId + '-') || tag === countryId)
);

const topicTags = uniqueTags.filter((tag) => !locationTags.includes(tag)).sort();

// Topic labels for display
const topicLabels: TagLabels = {
  featured: 'Featured',
  impact: 'Impact',
  policy: 'Policy analysis',
  technical: 'Technical report',
  api: 'API',
  'benefit-access': 'Benefit access',
  reconciliation: 'Reconciliation',
};

// Location labels for display (all US states + countries)
const locationLabels: TagLabels = {
  ca: 'Canada',
  us: 'United States',
  uk: 'United Kingdom',
  global: 'Global',
  ng: 'Nigeria',
  'us-dc': 'District of Columbia, U.S.',
  'us-ak': 'Alaska, U.S.',
  'us-al': 'Alabama, U.S.',
  'us-ar': 'Arkansas, U.S.',
  'us-az': 'Arizona, U.S.',
  'us-ca': 'California, U.S.',
  'us-co': 'Colorado, U.S.',
  'us-ct': 'Connecticut, U.S.',
  'us-de': 'Delaware, U.S.',
  'us-fl': 'Florida, U.S.',
  'us-ga': 'Georgia, U.S.',
  'us-hi': 'Hawaii, U.S.',
  'us-ia': 'Iowa, U.S.',
  'us-id': 'Idaho, U.S.',
  'us-il': 'Illinois, U.S.',
  'us-in': 'Indiana, U.S.',
  'us-ks': 'Kansas, U.S.',
  'us-ky': 'Kentucky, U.S.',
  'us-la': 'Louisiana, U.S.',
  'us-ma': 'Massachusetts, U.S.',
  'us-md': 'Maryland, U.S.',
  'us-me': 'Maine, U.S.',
  'us-mi': 'Michigan, U.S.',
  'us-mn': 'Minnesota, U.S.',
  'us-mo': 'Missouri, U.S.',
  'us-ms': 'Mississippi, U.S.',
  'us-mt': 'Montana, U.S.',
  'us-nc': 'North Carolina, U.S.',
  'us-nd': 'North Dakota, U.S.',
  'us-ne': 'Nebraska, U.S.',
  'us-nh': 'New Hampshire, U.S.',
  'us-nj': 'New Jersey, U.S.',
  'us-nm': 'New Mexico, U.S.',
  'us-nv': 'Nevada, U.S.',
  'us-ny': 'New York, U.S.',
  'us-oh': 'Ohio, U.S.',
  'us-ok': 'Oklahoma, U.S.',
  'us-or': 'Oregon, U.S.',
  'us-pa': 'Pennsylvania, U.S.',
  'us-ri': 'Rhode Island, U.S.',
  'us-sc': 'South Carolina, U.S.',
  'us-sd': 'South Dakota, U.S.',
  'us-tn': 'Tennessee, U.S.',
  'us-tx': 'Texas, U.S.',
  'us-ut': 'Utah, U.S.',
  'us-va': 'Virginia, U.S.',
  'us-vt': 'Vermont, U.S.',
  'us-wa': 'Washington, U.S.',
  'us-wi': 'Wisconsin, U.S.',
  'us-wv': 'West Virginia, U.S.',
  'us-wy': 'Wyoming, U.S.',
};

/**
 * Get combined research items (posts + apps with displayWithResearch)
 * sorted by date (newest first)
 */
export function getResearchItems(): ResearchItem[] {
  // Convert posts to ResearchItem format
  const postItems: ResearchItem[] = postsSorted.map((post) => ({
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

// Export processed data
export { postsSorted as posts, locationTags, uniqueTags, topicTags, locationLabels, topicLabels };

// Export default for convenience
export default {
  posts: postsSorted,
  locationTags,
  uniqueTags,
  topicTags,
  locationLabels,
  topicLabels,
  getResearchItems,
};
