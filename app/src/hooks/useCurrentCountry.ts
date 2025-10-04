import { useCurrentModel } from './useCurrentModel';
import { countryIds } from '@/libs/countries';

/**
 * Returns the current country ID based on the user's selected model.
 *
 * @returns The country ID based on user's current model
 */
export function useCurrentCountry(): (typeof countryIds)[number] {
  const { modelId } = useCurrentModel();

  // Map model ID to country ID
  if (modelId === 'policyengine_us') {
    return 'us';
  } else if (modelId === 'policyengine_uk') {
    return 'uk';
  }

  // Default fallback
  return 'uk';
}
