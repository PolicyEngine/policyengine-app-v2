import { toLegacyId } from '@/api/v2Associations';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import type {
  AssociationCountryId,
  UserSimulationCreateBody,
  UserSimulationItem,
  UserSimulationPatchBody,
} from '@/types/v2User';

/**
 * Converts between UserSimulation and the `/v2/user-simulations` wire
 * format. `simulationId` is the v1 simulation ID (`legacy_simulation_id`).
 */
export class UserSimulationAdapter {
  static toCreationPayload(
    userSimulation: Pick<UserSimulation, 'simulationId' | 'label'>,
    countryId: AssociationCountryId
  ): UserSimulationCreateBody {
    return {
      country_id: countryId,
      legacy_simulation_id: toLegacyId(userSimulation.simulationId, 'simulation'),
      ...(userSimulation.label ? { name: userSimulation.label } : {}),
    };
  }

  static toUpdatePayload(updates: Partial<UserSimulation>): UserSimulationPatchBody {
    const body: UserSimulationPatchBody = {};
    if ('label' in updates) {
      body.name = updates.label || null;
    }
    if (updates.simulationId !== undefined) {
      body.legacy_simulation_id = toLegacyId(updates.simulationId, 'simulation');
    }
    return body;
  }

  static hasLegacySimulation(item: UserSimulationItem): boolean {
    return item.legacy_simulation_id !== null && item.legacy_simulation_id !== undefined;
  }

  static fromApiItem(item: UserSimulationItem): UserSimulation {
    return {
      id: item.id,
      userId: item.user_id,
      simulationId: String(item.legacy_simulation_id),
      countryId: item.country_id,
      label: item.name ?? undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      isCreated: true,
    };
  }
}
