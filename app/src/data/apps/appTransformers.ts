/**
 * App Data Transformers
 *
 * Processes raw apps.json data to ensure slugs exist and provide
 * typed access to app data.
 */

import type { App } from '@/types/apps';
import appsData from './apps.json';

// Type assertion for imported JSON
const appsRaw = appsData as App[];

// Ensure all apps have slugs (fallback to title-based slug)
const apps = appsRaw.map((app) => ({
  ...app,
  slug: app.slug || app.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
}));

// Validate apps with displayWithResearch flag have required fields
apps.forEach((app) => {
  if (app.displayWithResearch) {
    const missingFields: string[] = [];

    if (!app.image) missingFields.push('image');
    if (!app.date) missingFields.push('date');
    if (!app.authors || app.authors.length === 0) missingFields.push('authors');

    if (missingFields.length > 0) {
      console.error(
        `App "${app.slug}" has displayWithResearch: true but is missing required fields: ${missingFields.join(', ')}`
      );
    }
  }
});

// Export processed apps
export { apps };

export default { apps };
