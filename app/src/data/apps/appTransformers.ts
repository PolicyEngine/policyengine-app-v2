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

// Export processed apps
export { apps };

export default { apps };
