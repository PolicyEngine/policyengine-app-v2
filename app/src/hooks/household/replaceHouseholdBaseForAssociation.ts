import { createHousehold } from '@/api/household';
import type { UserHouseholdStore } from '@/api/householdAssociation';
import {
  shadowCreateHousehold,
  shadowUpdateUserHouseholdAssociation,
} from '@/libs/migration/householdShadow';
import { Household } from '@/models/Household';
import type { AppHouseholdInputEnvelope } from '@/models/household/appTypes';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

function buildAssociationReplacementError(args: {
  associationId: string;
  createdHouseholdId: string;
  cause: unknown;
}): Error {
  const { associationId, createdHouseholdId, cause } = args;
  const message =
    cause instanceof Error ? cause.message : 'Unknown household association update failure';

  return new Error(
    `Failed to update household association ${associationId} after creating replacement household ${createdHouseholdId}. ` +
      `The replacement household may now be orphaned. Original error: ${message}`
  );
}

export async function replaceHouseholdBaseForAssociation(args: {
  association: UserHouseholdPopulation;
  nextHousehold: AppHouseholdInputEnvelope;
  store: Pick<UserHouseholdStore, 'update'>;
  shouldShadowV2?: boolean;
}): Promise<UserHouseholdPopulation> {
  const { association, nextHousehold: nextHouseholdInput, store, shouldShadowV2 = true } = args;

  if (!association.id) {
    throw new Error(
      'Household association must have an id before its base household can be replaced'
    );
  }

  const nextHouseholdModel = Household.fromAppInput({
    ...nextHouseholdInput,
    label: nextHouseholdInput.id ? null : (association.label ?? null),
  });
  const createdHousehold = await createHousehold(nextHouseholdModel.toV1CreationPayload());
  const nextHouseholdId = String(createdHousehold.result.household_id);
  let updatedAssociation: UserHouseholdPopulation;

  try {
    updatedAssociation = await store.update(association.id, {
      householdId: nextHouseholdId,
    });
  } catch (error) {
    throw buildAssociationReplacementError({
      associationId: association.id,
      createdHouseholdId: nextHouseholdId,
      cause: error,
    });
  }

  if (shouldShadowV2) {
    void (async () => {
      const persistedHousehold = nextHouseholdModel
        .withId(nextHouseholdId)
        .withLabel(updatedAssociation.label ?? association.label ?? null);
      const v2HouseholdId = await shadowCreateHousehold(nextHouseholdId, persistedHousehold);
      await shadowUpdateUserHouseholdAssociation(updatedAssociation, {
        previousHouseholdId: association.householdId,
        v2HouseholdId,
      });
    })();
  }

  return updatedAssociation;
}
