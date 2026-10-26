import { describe, expect, test } from 'vitest';
import {
  comparableValues,
  revenueSignText,
  signNote,
  signRelation,
  type SignedClaim,
} from '@/libs/flagship/signConvention';
import {
  PERSONAL_ALLOWANCE_1PCT,
  UK_SIGN_CONVENTIONS,
  ukClaim,
} from '@/tests/fixtures/libs/flagship/signConventionMocks';

describe('signRelation', () => {
  test.each(UK_SIGN_CONVENTIONS)(
    'given the %s convention for %s then the relation is %s',
    (convention, metric, expected) => {
      expect(signRelation(ukClaim({ metric, convention }))).toBe(expected);
    }
  );

  test('given no recorded convention then the figures share one sign, as every US claim does', () => {
    expect(signRelation({ metric: 'revenue_change', external_value: 1 })).toBe('same');
  });

  test('given an unsigned change direction then only magnitudes compare', () => {
    expect(
      signRelation(
        ukClaim({
          metric: 'revenue_change',
          convention: 'positive = yield to the Exchequer',
          changeDirection: 'unsigned',
        })
      )
    ).toBe('magnitude');
  });

  test('given the scorecard put PolicyEngine on the source’s sign then the convention is not applied again', () => {
    expect(
      signRelation(
        ukClaim({
          metric: 'revenue_change',
          convention: 'Note (verbatim): A positive sign implies an increase in borrowing.',
          annotations: ['claim sign: positive = cost / increase in borrowing; PE oriented to it'],
        })
      )
    ).toBe('same');
  });

  test('given a convention for a metric whose PolicyEngine sign is not established then it stays unknown', () => {
    expect(
      signRelation(
        ukClaim({
          metric: 'average_tax_change',
          convention: "positive = increase in the employee's tax liability",
        })
      )
    ).toBe('unknown');
  });

  test('given a household convention on a revenue metric then it is not guessed', () => {
    expect(
      signRelation(
        ukClaim({ metric: 'revenue_change', convention: 'positive = gain to households' })
      )
    ).toBe('unknown');
  });
});

describe('comparableValues', () => {
  test('given HMRC’s unsigned ready-reckoner cost then magnitudes compare: the gap is +13%, not -213%', () => {
    const values = comparableValues(PERSONAL_ALLOWANCE_1PCT)!;

    expect(values).toEqual({ model: 1_131_417_187, published: 1e9, relation: 'magnitude' });
    expect((values.model - values.published) / values.published).toBeCloseTo(0.131, 3);
  });

  test('given the opposite convention then the published figure takes PolicyEngine’s sign', () => {
    const row = ukClaim({
      metric: 'revenue_change',
      convention: 'positive = cost to the Exchequer',
      external: 2e9,
      value: -1.8e9,
    });

    expect(comparableValues(row)).toEqual({
      model: -1.8e9,
      published: -2e9,
      relation: 'opposite',
    });
  });

  test('given the same convention then both figures are unchanged', () => {
    const row = ukClaim({
      metric: 'average_household_income_change',
      convention: 'positive = gain to households',
      external: -20,
      value: -22,
    });

    expect(comparableValues(row)).toEqual({ model: -22, published: -20, relation: 'same' });
  });

  test('given an unclear convention or no model value then there is nothing to compare', () => {
    expect(
      comparableValues(ukClaim({ metric: 'gdp_level_effect', convention: 'positive = higher GDP' }))
    ).toBeNull();
    const noValue: SignedClaim = { ...PERSONAL_ALLOWANCE_1PCT, latest: { value: null } };
    expect(comparableValues(noValue)).toBeNull();
  });
});

describe('signNote', () => {
  test('given a flipped, a magnitude and an unclear sign then each says how the gap treats it', () => {
    expect(
      signNote(
        ukClaim({ metric: 'revenue_change', convention: 'positive = cost to the Exchequer' })
      )
    ).toMatch(/^Different signs: the source counts this change with the opposite sign/);
    expect(signNote(PERSONAL_ALLOWANCE_1PCT)).toMatch(/The gap compares magnitudes\.$/);
    expect(
      signNote(ukClaim({ metric: 'gdp_level_effect', convention: 'positive = higher GDP' }))
    ).toBe('The source’s sign convention is unclear; compare the magnitudes.');
  });

  test('given the same sign, or no model value, then no note shows', () => {
    expect(signNote({ metric: 'revenue_change', external_value: 1, latest: { value: 2 } })).toBe(
      null
    );
    expect(signNote({ ...PERSONAL_ALLOWANCE_1PCT, latest: null })).toBe(null);
  });
});

describe('revenueSignText', () => {
  test('given PolicyEngine oriented to a borrowing sign then the dialog says both use the source’s sign', () => {
    expect(
      revenueSignText(
        ukClaim({
          metric: 'revenue_change',
          convention: 'Note (verbatim): A positive sign implies an increase in borrowing.',
          annotations: ['claim sign: positive = cost / increase in borrowing; PE oriented to it'],
        })
      )
    ).toBe('Both figures use the source’s sign: positive amounts mean higher borrowing.');
  });

  test('given no convention then the PolicyEngine sign reads as before', () => {
    expect(revenueSignText({ metric: 'revenue_change', external_value: 1 })).toBe(
      'Negative amounts mean lower tax revenue.'
    );
  });
});
