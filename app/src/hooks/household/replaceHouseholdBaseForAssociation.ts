import { createHousehold } from '@/api/household';
import type { Household } from '@/models/Household';

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

/** Creates a v1 household (`POST /{country}/household`) and returns its id. */
async function createV1HouseholdId(household: Household): Promise<string> {
  const created = await createHousehold(household.toV1CreationPayload());
  return String(created.result.household_id);
}

/**
 * Edits a saved household: households never change once created, so the
 * edited household is created as a new one and the user's association is
 * pointed at it. The legacy builder creates v1 households; v3's saved
 * households pass `createHouseholdId`, which stores a v2 household.
 */
export async function replaceHouseholdBaseForAssociation<
  TAssociation extends { id?: string; label?: string | null },
>(args: {
  association: TAssociation;
  nextHousehold: Household;
  store: {
    update: (associationId: string, updates: { householdId: string }) => Promise<TAssociation>;
  };
  /** Creates the replacement household and returns its id; a v1 household unless given. */
  createHouseholdId?: (household: Household) => Promise<string>;
}): Promise<TAssociation> {
  const { association, nextHousehold, store, createHouseholdId = createV1HouseholdId } = args;

  if (!association.id) {
    throw new Error(
      'Household association must have an id before its base household can be replaced'
    );
  }

  const nextHouseholdModel = nextHousehold.withLabel(
    nextHousehold.id ? null : (association.label ?? null)
  );
  const nextHouseholdId = await createHouseholdId(nextHouseholdModel);
  let updatedAssociation: TAssociation;

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

  return updatedAssociation;
}
