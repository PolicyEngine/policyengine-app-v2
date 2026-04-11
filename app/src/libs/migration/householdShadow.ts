import { createHouseholdV2 } from '@/api/v2';
import {
  createUserHouseholdAssociationV2,
  updateUserHouseholdAssociationV2,
} from '@/api/v2/userHouseholdAssociations';
import { Household } from '@/models/Household';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { logMigrationComparison } from './comparisonLogger';
import { getMappedV2UserId, getOrCreateV2UserId, getV2Id, setV2Id } from './idMapping';
import { logMigrationConsole } from './migrationLogRuntime';
import { sendMigrationLog } from './migrationLogTransport';

function buildComparableUserHouseholdAssociation(
  v1Association: UserHouseholdPopulation,
  v2UserId: string,
  v2HouseholdId: string
): UserHouseholdPopulation {
  return {
    ...v1Association,
    userId: v2UserId,
    householdId: v2HouseholdId,
  };
}

export async function shadowCreateUserHouseholdAssociation(
  v1Association: UserHouseholdPopulation,
  v2HouseholdId = getV2Id('Household', v1Association.householdId)
): Promise<void> {
  if (!v2HouseholdId) {
    return;
  }

  try {
    const v2UserId = getOrCreateV2UserId(v1Association.userId);
    const v2Result = await createUserHouseholdAssociationV2({
      userId: v2UserId,
      householdId: v2HouseholdId,
      countryId: v1Association.countryId,
      label: v1Association.label,
    });

    if (v1Association.id && v2Result.id) {
      setV2Id('UserHousehold', v1Association.id, v2Result.id);
    }

    logMigrationComparison(
      'UserHouseholdMigration',
      'CREATE',
      buildComparableUserHouseholdAssociation(
        v1Association,
        v2UserId,
        v2HouseholdId
      ) as unknown as Record<string, unknown>,
      v2Result as unknown as Record<string, unknown>,
      { skipFields: ['id', 'createdAt', 'updatedAt', 'isCreated'] }
    );
  } catch (error) {
    logMigrationConsole('[UserHouseholdMigration] Shadow v2 create failed (non-blocking):', error);
    sendMigrationLog({
      kind: 'event',
      prefix: 'UserHouseholdMigration',
      operation: 'CREATE',
      status: 'FAILED',
      message: 'Shadow v2 create failed (non-blocking)',
      metadata: {
        householdId: v1Association.householdId,
        userId: v1Association.userId,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
  }
}

export async function shadowCreateHouseholdAndAssociation(args: {
  v1HouseholdId: string;
  v1Household: Household;
  v1Association?: UserHouseholdPopulation;
}): Promise<string | null> {
  const { v1HouseholdId, v1Household, v1Association } = args;

  const v2HouseholdId = await shadowCreateHousehold(v1HouseholdId, v1Household);

  if (v1Association && v2HouseholdId) {
    await shadowCreateUserHouseholdAssociation(v1Association, v2HouseholdId);
  }

  return v2HouseholdId;
}

export async function shadowCreateHousehold(
  v1HouseholdId: string,
  v1Household: Household
): Promise<string | null> {
  try {
    const v2Household = Household.fromV2Response(
      await createHouseholdV2(v1Household.toV2CreateRequest())
    );

    setV2Id('Household', v1HouseholdId, v2Household.id);
    logMigrationComparison(
      'HouseholdMigration',
      'CREATE',
      v1Household.toComparable() as unknown as Record<string, unknown>,
      v2Household.toComparable() as unknown as Record<string, unknown>,
      { skipFields: ['id'] }
    );
    return v2Household.id;
  } catch (error) {
    logMigrationConsole(
      '[HouseholdMigration] Shadow v2 household create failed (non-blocking):',
      error
    );
    sendMigrationLog({
      kind: 'event',
      prefix: 'HouseholdMigration',
      operation: 'CREATE',
      status: 'FAILED',
      message: 'Shadow v2 household create failed (non-blocking)',
      metadata: {
        householdId: v1HouseholdId,
        countryId: v1Household.countryId,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
    return null;
  }
}

export async function shadowUpdateUserHouseholdAssociation(
  v1Association: UserHouseholdPopulation,
  v2HouseholdId = getV2Id('Household', v1Association.householdId)
): Promise<void> {
  if (!v1Association.id) {
    return;
  }

  const v2UserHouseholdId = getV2Id('UserHousehold', v1Association.id);
  const v2UserId = getMappedV2UserId(v1Association.userId);

  if (!v2UserHouseholdId || !v2UserId || !v2HouseholdId) {
    return;
  }

  try {
    const v2Result = await updateUserHouseholdAssociationV2(v2UserHouseholdId, {
      label: v1Association.label ?? null,
      householdId: v2HouseholdId,
    });

    logMigrationComparison(
      'UserHouseholdMigration',
      'UPDATE',
      buildComparableUserHouseholdAssociation(
        v1Association,
        v2UserId,
        v2HouseholdId
      ) as unknown as Record<string, unknown>,
      v2Result as unknown as Record<string, unknown>,
      { skipFields: ['id', 'createdAt', 'updatedAt', 'isCreated'] }
    );
  } catch (error) {
    logMigrationConsole('[UserHouseholdMigration] Shadow v2 update failed (non-blocking):', error);
    sendMigrationLog({
      kind: 'event',
      prefix: 'UserHouseholdMigration',
      operation: 'UPDATE',
      status: 'FAILED',
      message: 'Shadow v2 update failed (non-blocking)',
      metadata: {
        householdId: v1Association.householdId,
        userId: v1Association.userId,
        associationId: v1Association.id,
        error: error instanceof Error ? error.message : String(error),
      },
      ts: new Date().toISOString(),
    });
  }
}
