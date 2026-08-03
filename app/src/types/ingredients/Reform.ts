import { countryIds } from '@/libs/countries';
import { Parameter } from '@/types/subIngredients/parameter';

/**
 * Where a reform came from. Provenance is what makes the flagship entry
 * modes (Ask/chat, Browse/tracker, Build/editor, one-off tools) composable:
 * every reform remembers its origin so reports can attribute it and other
 * modes can pick it up.
 */
export const reformSources = ['manual', 'chat', 'bill', 'tool'] as const;
export type ReformSource = (typeof reformSources)[number];

/**
 * How faithfully the encoded parameters represent the source material.
 * Only meaningful for non-manual sources (a bill may be approximated,
 * a chat encoding may cover a subset of what was asked).
 */
export const reformConfidences = ['exact', 'approximated', 'partial'] as const;
export type ReformConfidence = (typeof reformConfidences)[number];

export interface ReformProvenance {
  source: ReformSource;
  /** Source-specific reference: bill id, chat session id, tool slug */
  ref?: string;
  confidence?: ReformConfidence;
}

export const reformBaselines = ['current-law', 'current-policy'] as const;
export type ReformBaseline = (typeof reformBaselines)[number];

/**
 * The canonical reform object of the flagship app.
 *
 * A Reform is user-owned, mutable content — unlike Policy, which is an
 * immutable record in the main PolicyEngine API. When a reform is
 * simulated, it is materialized into a canonical Policy via the existing
 * createPolicy() flow and the resulting id is linked back via policyId.
 */
export interface Reform {
  id?: string;
  userId: string;
  countryId: (typeof countryIds)[number];
  label?: string | null;
  /** Canonical policy id in api.policyengine.org once materialized */
  policyId?: string | null;
  parameters: Parameter[];
  baseline: ReformBaseline;
  provenance: ReformProvenance;
  createdAt?: string;
  updatedAt?: string;
}

export const CURRENT_LAW_BASELINE: ReformBaseline = 'current-law';
