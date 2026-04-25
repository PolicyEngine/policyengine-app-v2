import { fetchSimulationByIdV2 } from '@/api/v2/simulations';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import { logMigrationComparison } from './comparisonLogger';
import { logMigrationConsole } from './migrationLogRuntime';
import { sendMigrationLog } from './migrationLogTransport';

function buildComparableSimulation(simulation: Simulation): Record<string, unknown> {
  return {
    simulationType: simulation.simulationType ?? null,
    policyId: simulation.policyId ?? null,
    populationId: simulation.populationId ?? null,
    populationType: simulation.populationType ?? null,
    status: simulation.status ?? null,
    backendStatus: simulation.backendStatus ?? null,
    regionCode: simulation.regionCode ?? null,
    datasetId: simulation.datasetId ?? null,
    outputDatasetId: simulation.outputDatasetId ?? null,
    filterField: simulation.filterField ?? null,
    filterValue: simulation.filterValue ?? null,
    errorMessage: simulation.errorMessage ?? null,
  };
}

function buildComparableUserSimulationAssociation(
  association: Pick<UserSimulation, 'userId' | 'simulationId' | 'countryId' | 'label'>,
  v2UserId: string,
  v2SimulationId = association.simulationId
): Record<string, unknown> {
  return {
    userId: v2UserId,
    simulationId: v2SimulationId,
    countryId: association.countryId,
    label: association.label ?? null,
  };
}

function logSimulationEvent(
  prefix: 'SimulationMigration' | 'UserSimulationMigration',
  operation: string,
  status: 'FAILED' | 'SKIPPED',
  message: string,
  metadata: Record<string, string | number | boolean | null>
): void {
  logMigrationConsole(`[${prefix}] ${message}`);
  sendMigrationLog({
    kind: 'event',
    prefix,
    operation,
    status,
    message,
    metadata,
    ts: new Date().toISOString(),
  });
}

export async function compareMappedSimulationRead(
  v1Simulation: Simulation,
  v2SimulationId: string
): Promise<void> {
  if (!v1Simulation.id) {
    return;
  }

  try {
    const v2Simulation = await fetchSimulationByIdV2(v2SimulationId);
    logMigrationComparison(
      'SimulationMigration',
      'READ',
      buildComparableSimulation(v1Simulation),
      buildComparableSimulation(v2Simulation)
    );
  } catch (error) {
    logSimulationEvent(
      'SimulationMigration',
      'READ',
      'FAILED',
      'Mapped v2 simulation fetch failed during read comparison',
      {
        v1SimulationId: v1Simulation.id,
        v2SimulationId,
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

export function logSkippedSimulationRead(
  v1SimulationId: string,
  message: string,
  metadata: Record<string, string | number | boolean | null> = {}
): void {
  logSimulationEvent('SimulationMigration', 'READ', 'SKIPPED', message, {
    v1SimulationId,
    ...metadata,
  });
}

export function logUserSimulationAssociationComparison(
  operation: 'CREATE' | 'UPDATE',
  association: Pick<UserSimulation, 'userId' | 'simulationId' | 'countryId' | 'label'>,
  v2Association: UserSimulation,
  options: { v2UserId: string; v2SimulationId?: string }
): void {
  logMigrationComparison(
    'UserSimulationMigration',
    operation,
    buildComparableUserSimulationAssociation(association, options.v2UserId, options.v2SimulationId),
    buildComparableUserSimulationAssociation(
      v2Association,
      v2Association.userId,
      v2Association.simulationId
    )
  );
}

export function logSkippedUserSimulationAssociationOperation(
  operation: 'LIST' | 'READ' | 'CREATE' | 'UPDATE',
  message: string,
  metadata: Record<string, string | number | boolean | null> = {}
): void {
  logSimulationEvent('UserSimulationMigration', operation, 'SKIPPED', message, metadata);
}
