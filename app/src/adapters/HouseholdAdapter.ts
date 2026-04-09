import { type CountryId } from '@/libs/countries';
import { Household as HouseholdModel } from '@/models/Household';
import type { Household, HouseholdData } from '@/types/ingredients/Household';
import type { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import type { HouseholdCreationPayload } from '@/types/payloads';

/**
 * Compatibility wrapper around the canonical Household model.
 *
 * Phase 2b moves the conversion logic into Household.ts. This adapter remains
 * temporarily so existing callers do not need to switch all at once.
 */
export class HouseholdAdapter {
  static fromMetadata(metadata: HouseholdMetadata): Household {
    const household = HouseholdModel.fromV1Metadata(metadata);

    return {
      id: household.id,
      countryId: household.countryId,
      householdData: household.data as HouseholdData,
    };
  }

  static toCreationPayload(
    householdData: HouseholdData,
    countryId: string
  ): HouseholdCreationPayload {
    return HouseholdModel.fromDraft({
      countryId: countryId as CountryId,
      householdData,
    }).toV1CreationPayload();
  }
}
