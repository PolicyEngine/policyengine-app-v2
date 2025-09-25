import { GeolocationProvider } from '../types';

/**
 * Geolocation provider using browser language settings
 * This is an instant fallback when IP detection fails or is too slow
 */
export class BrowserProvider implements GeolocationProvider {
  name = 'Browser';
  priority = 3; // Lowest priority - final fallback

  async detect(): Promise<string | null> {
    try {
      // Get browser language (e.g., 'en-US', 'en-GB', 'fr-CA')
      const language = navigator.language || (navigator as any).userLanguage;

      if (!language) {
        return null;
      }

      // Extract country code from language tag
      // Format is usually 'language-COUNTRY' (e.g., 'en-US')
      const parts = language.split('-');

      if (parts.length >= 2) {
        // Return the country part (already in ISO format)
        return parts[1].toUpperCase();
      }

      // If no country in language tag, try to infer from language
      // This is a simple mapping for common cases
      const languageCountryMap: Record<string, string> = {
        en: 'US', // Default English to US
        fr: 'CA', // French could be CA (PolicyEngine supports Canada)
        he: 'IL', // Hebrew to Israel
        // Add more mappings as needed
      };

      const langCode = parts[0].toLowerCase();
      return languageCountryMap[langCode] || null;
    } catch (error) {
      return null;
    }
  }
}
