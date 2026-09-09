import { describe, expect, test } from 'vitest';
import { Household } from '@/models/Household';
import {
  changeReportYear,
  copyHouseholdToYear,
} from '@/pages/reportBuilder/utils/changeReportYear';
import {
  annualYearCopyData,
  mixedYearCopyHousehold,
  scalarYearCopyHousehold,
  ukYearCopyHousehold,
  YEAR_COPY_MEMBERS,
  YEAR_COPY_POLICIES,
  YEAR_COPY_REFORM_SOURCE,
  YEAR_COPY_SOURCE,
  YEAR_COPY_SPM,
  YEAR_COPY_TARGET,
  yearCopyHousehold,
  yearCopyHouseholdWithoutYearAnchor,
  yearCopyReportState,
} from '@/tests/fixtures/pages/reportBuilder/changeReportYearMocks';

function snapshot(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

describe('copyHouseholdToYear', () => {
  test('given an annual household then copies every input group with exact values and preserved explicit SPM settings', () => {
    const original = yearCopyHousehold();
    const originalSnapshot = original.toJSON();
    const copied = copyHouseholdToYear(original, YEAR_COPY_TARGET);

    expect(copied.id).not.toBe(original.id);
    expect(copied.year).toBe(Number(YEAR_COPY_TARGET));
    expect(copied.countryId).toBe(original.countryId);
    expect(copied.label).toBe(original.label);
    expect(copied.householdData).toEqual(annualYearCopyData(YEAR_COPY_TARGET));
    expect(copied.spm).toEqual(YEAR_COPY_SPM);
    const payload = copied.toV1CreationPayload();
    expect(payload.spm).toEqual(YEAR_COPY_SPM);
    expect(payload.data.people.you.age).toEqual({ [YEAR_COPY_TARGET]: 40 });
    expect(payload.data.people.you.employment_income).toEqual({ [YEAR_COPY_TARGET]: 50000 });
    expect(payload.data.people.you.birth_date).toEqual({ [YEAR_COPY_TARGET]: '1986-04-12' });
    expect(payload.data.households?.['home 06037'].county_fips).toEqual({
      [YEAR_COPY_TARGET]: '06037',
    });
    expect(payload.data.households?.['home 06037'].rent).toEqual({ [YEAR_COPY_TARGET]: 12000 });
    for (const groups of [
      payload.data.households,
      payload.data.families,
      payload.data.tax_units,
      payload.data.spm_units,
    ]) {
      expect(Object.values(groups!)[0].members).toEqual(YEAR_COPY_MEMBERS);
    }
    expect(payload.data.marital_units?.['your marital unit'].members).toEqual(['you']);
    expect(payload.data.marital_units?.["Sam's marital unit"].members).toEqual(['Sam false null']);
    expect(original.toJSON()).toEqual(originalSnapshot);
    expect(original.toV1CreationPayload().data.people.you.age).toEqual({ [YEAR_COPY_SOURCE]: 40 });
  });

  test('given UK benefit-unit inputs then copies their periods without changing membership or values', () => {
    const original = ukYearCopyHousehold();
    const copied = copyHouseholdToYear(original, YEAR_COPY_TARGET);
    expect(copied.toV1CreationPayload().data.benunits).toEqual({
      'benefit unit': { members: ['you'], benunit_income: { [YEAR_COPY_TARGET]: 35000 } },
    });
    expect(copied.spm).toBeUndefined();
    expect(original.toV1CreationPayload().data.benunits?.['benefit unit'].benunit_income).toEqual({
      [YEAR_COPY_SOURCE]: 35000,
    });
  });

  test('given scalar inputs then serializes their unchanged values in the selected year', () => {
    const original = scalarYearCopyHousehold(YEAR_COPY_SOURCE);
    const copied = copyHouseholdToYear(original, YEAR_COPY_TARGET);
    expect(copied.householdData).toEqual(original.householdData);
    expect(copied.toV1CreationPayload().data.people.you).toEqual({
      age: { [YEAR_COPY_TARGET]: 40 },
      employment_income: { [YEAR_COPY_TARGET]: 50000 },
    });
    expect(copied.toV1CreationPayload().data.households?.home.county_fips).toEqual({
      [YEAR_COPY_TARGET]: '06037',
    });
  });

  test.each(['dated', 'scalar'] as const)(
    'given %s inputs already owned by the selected year then reuses the saved household',
    (kind) => {
      const household =
        kind === 'dated'
          ? yearCopyHousehold(YEAR_COPY_TARGET)
          : scalarYearCopyHousehold(YEAR_COPY_TARGET);
      expect(copyHouseholdToYear(household, YEAR_COPY_TARGET)).toBe(household);
    }
  );
});

describe('changeReportYear', () => {
  test('given independent household source years then creates independent drafts and preserves policies and original snapshots', () => {
    const state = yearCopyReportState();
    const original = snapshot(state);
    const changed = changeReportYear(state, YEAR_COPY_TARGET);
    const [baseline, reform] = changed.simulations;

    expect(changed.year).toBe(YEAR_COPY_TARGET);
    expect(baseline.population.household?.householdData).toEqual(
      annualYearCopyData(YEAR_COPY_TARGET)
    );
    expect(reform.population.household?.householdData).toEqual(
      annualYearCopyData(YEAR_COPY_TARGET)
    );
    expect(baseline.population.household?.id).not.toBe(reform.population.household?.id);
    expect(state.simulations[1].population.household?.year).toBe(Number(YEAR_COPY_REFORM_SOURCE));
    changed.simulations.forEach((simulation, index) => {
      expect(simulation.id).toBeUndefined();
      expect(simulation.output).toBeNull();
      expect(simulation.status).toBe('pending');
      expect(simulation.population.householdNeedsCreation).toBe(true);
      expect(simulation.policy).toBe(state.simulations[index].policy);
      expect(simulation.policy.parameters).toEqual(YEAR_COPY_POLICIES[index].parameters);
    });
    expect(snapshot(state)).toEqual(original);
  });

  test('given separate model instances representing the same saved household then shares one replacement draft', () => {
    const household = yearCopyHousehold();
    const equivalent = Household.fromAppInput(household.toJSON());
    expect(equivalent).not.toBe(household);
    const changed = changeReportYear(
      yearCopyReportState([household, equivalent]),
      YEAR_COPY_TARGET
    );
    expect(changed.simulations[0].population.household).toBe(
      changed.simulations[1].population.household
    );
    expect(changed.simulations[0].population.householdNeedsCreation).toBe(true);
    expect(changed.simulations[1].population.householdNeedsCreation).toBe(true);
  });

  test('given the same selected input year then preserves simulation identities and saved output', () => {
    const state = yearCopyReportState([yearCopyHousehold(YEAR_COPY_TARGET)]);
    const changed = changeReportYear(state, YEAR_COPY_TARGET);
    expect(changed.simulations[0]).toBe(state.simulations[0]);
    expect(changed.simulations[0].population.householdNeedsCreation).toBeUndefined();
    expect(changed.simulations[0].id).toBe('saved-simulation-0');
    expect(changed.simulations[0].output).toBe(state.simulations[0].output);
  });

  test('given a reform with historical multi-year inputs then rejects atomically without discarding history or altering the baseline', () => {
    const state = yearCopyReportState([yearCopyHousehold(), mixedYearCopyHousehold()]);
    const original = snapshot(state);
    expect(() => changeReportYear(state, YEAR_COPY_TARGET)).toThrow(
      /Reform household:.*multiple years/
    );
    expect(snapshot(state)).toEqual(original);
    expect(state.simulations[1].population.household?.people.you.employment_income).toEqual({
      '2024': 47000,
      [YEAR_COPY_SOURCE]: 50000,
    });
  });

  test.each(['renamed person', 'missing age', 'null age'] as const)(
    'given %s in the reform household then rejects atomically without inventing a year anchor',
    (kind) => {
      const state = yearCopyReportState([
        yearCopyHousehold(),
        yearCopyHouseholdWithoutYearAnchor(kind),
      ]);
      const original = snapshot(state);
      expect(() => changeReportYear(state, YEAR_COPY_TARGET)).toThrow(
        /Reform household:.*does not identify a calculation year/
      );
      expect(snapshot(state)).toEqual(original);
    }
  );

  test.each(['', '202', '2026-01', 'year', '-2023'])(
    'given invalid report year %j then rejects without mutating saved state',
    (year) => {
      const state = yearCopyReportState();
      const original = snapshot(state);
      expect(() => changeReportYear(state, year)).toThrow(/four-digit report year/);
      expect(snapshot(state)).toEqual(original);
    }
  );

  test('given no household then still rejects an invalid report year', () => {
    const state = yearCopyReportState([]);
    const original = snapshot(state);
    expect(() => changeReportYear(state, '2026-01')).toThrow(/four-digit report year/);
    expect(snapshot(state)).toEqual(original);
  });
});
