import type { CountryId } from '@/libs/countries';
import { resumeDraftFor, setDraftPopulation, startDraftReform } from '@/libs/draftReform';
import { regionLevel } from './baselineData';

/**
 * Points the draft reform at a place before Build opens: the state or
 * district the user chose on Explore, or the whole country. A draft
 * already in hand keeps its parameters; only its population changes.
 * Returns whether such a draft was kept, so the page can say so.
 */
export function draftForRegion(countryId: CountryId, region: string): { keptDraft: boolean } {
  const existing = resumeDraftFor(countryId);
  if (!existing) {
    startDraftReform(countryId, 'manual');
  }
  setDraftPopulation({
    scope: 'national',
    ...(regionLevel(region) === 'nation' ? {} : { region }),
  });
  return { keptDraft: !!existing && existing.provisions.length > 0 };
}
