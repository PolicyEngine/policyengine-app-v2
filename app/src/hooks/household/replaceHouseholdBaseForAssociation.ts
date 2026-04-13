import { createHousehold } from '@/api/household';
import type { UserHouseholdStore } from '@/api/householdAssociation';
import {
  shadowCreateHousehold,
  shadowUpdateUserHouseholdAssociation,
} from '@/libs/migration/householdShadow';
import { Household, type HouseholdInput } from '@/models/Household';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

export async function replaceHouseholdBaseForAssociation(args: {
  association: UserHouseholdPopulation;
  nextHousehold: HouseholdInput;
  store: Pick<UserHouseholdStore, 'update'>;
}): Promise<UserHouseholdPopulation> {
  const { association, nextHousehold, store } = args;

  if (!association.id) {
    throw new Error(
      'Household association must have an id before its base household can be replaced'
    );
  }

  const nextHouseholdModel = Household.fromInput({
    ...nextHousehold,
    label: nextHousehold.id ? null : (association.label ?? null),
  });
  const createdHousehold = await createHousehold(nextHouseholdModel.toV1CreationPayload());
  const nextHouseholdId = String(createdHousehold.result.household_id);
  const updatedAssociation = await store.update(association.id, {
    householdId: nextHouseholdId,
  });

  void (async () => {
    const persistedHousehold = nextHouseholdModel
      .withId(nextHouseholdId)
      .withLabel(updatedAssociation.label ?? association.label ?? null);
    const v2HouseholdId = await shadowCreateHousehold(nextHouseholdId, persistedHousehold);
    await shadowUpdateUserHouseholdAssociation(updatedAssociation, v2HouseholdId ?? undefined);
  })();

  return updatedAssociation;
}
