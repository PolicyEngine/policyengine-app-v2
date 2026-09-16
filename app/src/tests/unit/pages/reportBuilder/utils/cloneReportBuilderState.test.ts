import { describe, expect, test } from 'vitest';
import { Household } from '@/models/Household';
import { cloneReportBuilderState } from '@/pages/reportBuilder/utils/cloneReportBuilderState';
import { ownershipReportState } from '@/tests/fixtures/spm/reportBuilderOwnershipMocks';

describe('cloneReportBuilderState', () => {
  test('given independent households then reset retains usable models, settings, identity, and policy dates without sharing mutable branches', () => {
    const original = ownershipReportState();
    const originalJSON = JSON.stringify(original);
    const cloned = cloneReportBuilderState(original);

    expect(JSON.stringify(cloned)).toBe(originalJSON);
    cloned.simulations.forEach((simulation, index) => {
      const household = simulation.population.household!;
      expect(household).toBeInstanceOf(Household);
      expect(household).not.toBe(original.simulations[index].population.household);
      expect(household.toV1CreationPayload()).toEqual(
        original.simulations[index].population.household!.toV1CreationPayload()
      );
      simulation.population.household = household.withLabel('Edited after reset');
      simulation.policy.parameters[0].values[0].value = 99;
    });

    expect(JSON.stringify(original)).toBe(originalJSON);
    expect(cloned.simulations[0].population.household!.id).not.toBe(
      cloned.simulations[1].population.household!.id
    );
  });

  test('given a pending household creation marker then cloning preserves it with the draft model', () => {
    const original = ownershipReportState();
    original.simulations[0].population.householdNeedsCreation = true;

    const cloned = cloneReportBuilderState(original);

    expect(cloned.simulations[0].population.householdNeedsCreation).toBe(true);
    expect(cloned.simulations[0].population.household).toBeInstanceOf(Household);
  });
});
