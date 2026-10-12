import { describe, expect, test } from 'vitest';
import { UserSimulationAdapter } from '@/adapters/UserSimulationAdapter';
import {
  ASSOCIATION_IDS,
  LEGACY_IDS,
  PE_USER_ID,
  simulationItem,
  TIMESTAMPS,
} from '@/tests/fixtures/api/v2UserMocks';

describe('UserSimulationAdapter', () => {
  test('given a simulation association then the creation payload carries legacy_simulation_id', () => {
    expect(
      UserSimulationAdapter.toCreationPayload(
        { simulationId: String(LEGACY_IDS.SIMULATION), label: 'Reform run' },
        'uk'
      )
    ).toEqual({
      country_id: 'uk',
      legacy_simulation_id: LEGACY_IDS.SIMULATION,
      name: 'Reform run',
    });
  });

  test('given updates then only supplied fields are patched', () => {
    expect(UserSimulationAdapter.toUpdatePayload({ label: 'Renamed' })).toEqual({
      name: 'Renamed',
    });
    expect(UserSimulationAdapter.toUpdatePayload({ simulationId: '9' })).toEqual({
      legacy_simulation_id: 9,
    });
  });

  test('given an API item then it maps to a UserSimulation', () => {
    expect(UserSimulationAdapter.fromApiItem(simulationItem({ name: 'Reform run' }))).toEqual({
      id: ASSOCIATION_IDS.SIMULATION,
      userId: PE_USER_ID,
      simulationId: String(LEGACY_IDS.SIMULATION),
      countryId: 'us',
      label: 'Reform run',
      createdAt: TIMESTAMPS.CREATED,
      updatedAt: TIMESTAMPS.UPDATED,
      isCreated: true,
    });
  });
});
