import { createHouseholdV2 } from '@/api/v2';
import { createUserHouseholdAssociationV2 } from '@/api/v2/userHouseholdAssociations';
import { Household } from '@/models/Household';
import type { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { logMigrationComparison } from './comparisonLogger';
import { getOrCreateV2UserId, getV2Id, setV2Id } from './idMapping';
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
}): Promise<void> {
  const { v1HouseholdId, v1Household, v1Association } = args;

  try {
    const v2Household = await createHouseholdV2(v1Household.toV2Shape());
    if (!v2Household.id) {
      throw new Error('Shadow v2 create returned a household without an id');
    }

    setV2Id('Household', v1HouseholdId, v2Household.id);
    logMigrationComparison(
      'HouseholdMigration',
      'CREATE',
      v1Household.toComparable() as unknown as Record<string, unknown>,
      Household.fromV2Shape({
        ...v2Household,
        id: v2Household.id,
      }).toComparable() as unknown as Record<string, unknown>,
      { skipFields: ['id'] }
    );

    if (v1Association) {
      await shadowCreateUserHouseholdAssociation(v1Association, v2Household.id);
    }
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
  }
}
