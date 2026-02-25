import { describe, expect, test } from 'vitest';
import {
  isHouseholdAssociationReady,
  isPolicyConfigured,
  isPopulationConfigured,
  isSimulationConfigured,
  isSimulationPersisted,
  isSimulationReadyToSubmit,
} from '@/utils/validation/ingredientValidation';

describe('isPolicyConfigured', () => {
  test('given policy with id then returns true', () => {
    expect(isPolicyConfigured({ id: 'policy-1' } as any)).toBe(true);
  });

  test('given policy without id then returns false', () => {
    expect(isPolicyConfigured({} as any)).toBe(false);
  });

  test('given null then returns false', () => {
    expect(isPolicyConfigured(null)).toBe(false);
  });

  test('given undefined then returns false', () => {
    expect(isPolicyConfigured(undefined)).toBe(false);
  });
});

describe('isPopulationConfigured', () => {
  test('given population with household id then returns true', () => {
    expect(isPopulationConfigured({ household: { id: 'hh-1' } } as any)).toBe(true);
  });

  test('given population with geography regionCode then returns true', () => {
    expect(isPopulationConfigured({ geography: { regionCode: 'state/ca' } } as any)).toBe(true);
  });

  test('given population with no household or geography then returns false', () => {
    expect(isPopulationConfigured({} as any)).toBe(false);
  });

  test('given null then returns false', () => {
    expect(isPopulationConfigured(null)).toBe(false);
  });

  test('given undefined then returns false', () => {
    expect(isPopulationConfigured(undefined)).toBe(false);
  });
});

describe('isSimulationConfigured', () => {
  test('given simulation with id then returns true', () => {
    expect(isSimulationConfigured({ id: 'sim-1' } as any)).toBe(true);
  });

  test('given simulation with configured policy and population then returns true', () => {
    expect(
      isSimulationConfigured({
        policy: { id: 'policy-1' },
        population: { household: { id: 'hh-1' } },
      } as any)
    ).toBe(true);
  });

  test('given simulation with configured policy but unconfigured population then returns false', () => {
    expect(
      isSimulationConfigured({
        policy: { id: 'policy-1' },
        population: {},
      } as any)
    ).toBe(false);
  });

  test('given null then returns false', () => {
    expect(isSimulationConfigured(null)).toBe(false);
  });

  test('given undefined then returns false', () => {
    expect(isSimulationConfigured(undefined)).toBe(false);
  });
});

describe('isSimulationReadyToSubmit', () => {
  test('given configured policy and population then returns true', () => {
    expect(
      isSimulationReadyToSubmit({
        policy: { id: 'p-1' },
        population: { household: { id: 'h-1' } },
      } as any)
    ).toBe(true);
  });

  test('given unconfigured policy then returns false', () => {
    expect(
      isSimulationReadyToSubmit({
        policy: {},
        population: { household: { id: 'h-1' } },
      } as any)
    ).toBe(false);
  });

  test('given null then returns false', () => {
    expect(isSimulationReadyToSubmit(null)).toBe(false);
  });
});

describe('isSimulationPersisted', () => {
  test('given simulation with id then returns true', () => {
    expect(isSimulationPersisted({ id: 'sim-1' } as any)).toBe(true);
  });

  test('given simulation without id then returns false', () => {
    expect(isSimulationPersisted({} as any)).toBe(false);
  });

  test('given null then returns false', () => {
    expect(isSimulationPersisted(null)).toBe(false);
  });
});

describe('isHouseholdAssociationReady', () => {
  test('given loaded association with people then returns true', () => {
    expect(
      isHouseholdAssociationReady({
        isLoading: false,
        household: { id: 'hh-1', people: [{ name: 'Person 1' }] },
      } as any)
    ).toBe(true);
  });

  test('given still loading then returns false', () => {
    expect(
      isHouseholdAssociationReady({
        isLoading: true,
        household: { id: 'hh-1', people: [{ name: 'Person 1' }] },
      } as any)
    ).toBe(false);
  });

  test('given no household data then returns false', () => {
    expect(
      isHouseholdAssociationReady({
        isLoading: false,
        household: null,
      } as any)
    ).toBe(false);
  });

  test('given household with empty people then returns false', () => {
    expect(
      isHouseholdAssociationReady({
        isLoading: false,
        household: { id: 'hh-1', people: [] },
      } as any)
    ).toBe(false);
  });

  test('given null then returns false', () => {
    expect(isHouseholdAssociationReady(null)).toBe(false);
  });

  test('given undefined then returns false', () => {
    expect(isHouseholdAssociationReady(undefined)).toBe(false);
  });
});
