/**
 * Static modelled policy definitions for US and UK
 * These define the pre-configured policy options (baseline, reforms, etc.)
 *
 * NOTE: This is a placeholder implementation. The modelled policies structure
 * should be updated with correct policy definitions in the future.
 */

export interface PolicyInfo {
  id: string | null;
  label: string;
  description?: string;
}

export interface ModelledPolicies {
  core: Record<string, PolicyInfo>;
  filtered: Record<string, PolicyInfo>;
}

/**
 * US modelled policies
 */
export const US_MODELLED_POLICIES: ModelledPolicies = {
  core: {
    baseline: {
      id: null,
      label: 'Current law',
      description: 'The current US tax and benefit system',
    },
  },
  filtered: {},
};

/**
 * UK modelled policies
 */
export const UK_MODELLED_POLICIES: ModelledPolicies = {
  core: {
    baseline: {
      id: null,
      label: 'Current law',
      description: 'The current UK tax and benefit system',
    },
  },
  filtered: {},
};

/**
 * Get modelled policies for a country
 */
export function getModelledPolicies(countryId: string): ModelledPolicies {
  switch (countryId) {
    case 'us':
      return US_MODELLED_POLICIES;
    case 'uk':
      return UK_MODELLED_POLICIES;
    default:
      return { core: {}, filtered: {} };
  }
}

/**
 * Current law ID constant.
 * In V2 API, current law is represented by policy_id = null.
 * This is consistent across all countries.
 */
export const CURRENT_LAW_ID: null = null;

/**
 * Get current law ID for a country.
 * Returns null for all countries (V2 API convention).
 */
export function getCurrentLawId(_countryId: string): null {
  return null;
}
