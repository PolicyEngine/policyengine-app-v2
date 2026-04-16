import { describe, expect, test } from 'vitest';
import type { AppHouseholdInputEnvelope } from '@/models/household/appTypes';
import { getHeadOfHouseholdPersonName } from '@/utils/householdHead';

const YEAR = '2026';

describe('getHeadOfHouseholdPersonName', () => {
  test('prefers the canonical "you" person when present', () => {
    const household: AppHouseholdInputEnvelope = {
      countryId: 'us',
      householdData: {
        people: {
          spouse: {
            age: { [YEAR]: 35 },
          },
          you: {
            age: { [YEAR]: 36 },
          },
        },
        taxUnits: {
          taxUnit1: {
            members: ['spouse', 'you'],
          },
        },
      },
    };

    expect(getHeadOfHouseholdPersonName(household, YEAR)).toBe('you');
  });

  test('falls back to the first adult member of the first tax unit when flags are absent', () => {
    const household: AppHouseholdInputEnvelope = {
      countryId: 'us',
      householdData: {
        people: {
          child: {
            age: { [YEAR]: 10 },
          },
          adult: {
            age: { [YEAR]: 40 },
          },
        },
        taxUnits: {
          taxUnit1: {
            members: ['child', 'adult'],
          },
        },
      },
    };

    expect(getHeadOfHouseholdPersonName(household, YEAR)).toBe('adult');
  });

  test('falls back to you when no explicit group structure exists', () => {
    const household: AppHouseholdInputEnvelope = {
      countryId: 'us',
      householdData: {
        people: {
          'your partner': {
            age: { [YEAR]: 31 },
          },
          you: {
            age: { [YEAR]: 30 },
          },
        },
      },
    };

    expect(getHeadOfHouseholdPersonName(household, YEAR)).toBe('you');
  });

  test('uses stable sorted fallback when no other signal exists', () => {
    const household: AppHouseholdInputEnvelope = {
      countryId: 'uk',
      householdData: {
        people: {
          zed: {
            age: { [YEAR]: 17 },
          },
          alex: {
            age: { [YEAR]: 16 },
          },
        },
      },
    };

    expect(getHeadOfHouseholdPersonName(household, YEAR)).toBe('alex');
  });
});
