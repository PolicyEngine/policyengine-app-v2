/**
 * Plugin interface for extensible app functionality
 * Following patterns from browser extension stores (Chrome/Firefox)
 */
export interface Plugin {
  /** Display name of the plugin */
  name: string;

  /** URL-friendly unique identifier */
  slug: string;

  /** Brief description of what the plugin does */
  description: string;

  /** Date plugin was created (ISO format: YYYY-MM-DD) */
  dateCreated: string;

  /** Date plugin was last updated (ISO format: YYYY-MM-DD) */
  dateUpdated: string;

  /** Path to plugin image/icon (relative to public directory) */
  image: string;
}
