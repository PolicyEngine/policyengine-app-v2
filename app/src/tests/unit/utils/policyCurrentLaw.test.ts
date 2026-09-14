import { describe, expect, test } from 'vitest';
import {
  createParameter,
  CURRENT_LAW_METADATA,
  TEST_PARAMETER_NAMES,
} from '@/tests/fixtures/utils/policyCurrentLawMocks';
import {
  hasEffectivePolicyChanges,
  hasRequiredPolicyMetadata,
  NoEffectivePolicyChangesError,
  normalizeParameterIntervals,
  normalizePolicyParameters,
  policyValuesEqual,
  requireEffectivePolicyParameters,
} from '@/utils/policyCurrentLaw';

const READY_METADATA = {
  loading: false,
  error: null,
  currentCountry: 'us',
  currentLawId: 1,
  version: 'test',
  parameters: CURRENT_LAW_METADATA,
};

describe('hasRequiredPolicyMetadata', () => {
  const parameter = createParameter(
    TEST_PARAMETER_NAMES.changingAmount,
    '2026-01-01',
    '2026-12-31',
    150
  );

  test('given current model metadata covers every proposed parameter then returns true', () => {
    expect(hasRequiredPolicyMetadata(READY_METADATA, 'us', [parameter])).toBe(true);
  });

  test.each([
    ['loading', { loading: true }],
    ['an error', { error: 'Metadata failed' }],
    ['another country', { currentCountry: 'uk' }],
    ['no model version', { version: null }],
    ['no current-law policy', { currentLawId: 0 }],
  ])('given metadata has %s then returns false', (_label, patch) => {
    expect(hasRequiredPolicyMetadata({ ...READY_METADATA, ...patch }, 'us', [parameter])).toBe(
      false
    );
  });

  test('given a proposed parameter has no current-law values then returns false', () => {
    const unknown = createParameter(
      TEST_PARAMETER_NAMES.missingMetadata,
      '2026-01-01',
      '2026-12-31',
      1
    );

    expect(hasRequiredPolicyMetadata(READY_METADATA, 'us', [unknown])).toBe(false);
  });

  test.each([
    ['an empty value map', {}],
    ['only invalid effective dates', { not_a_date: 100 }],
  ])('given current-law metadata has %s then returns false', (_label, values) => {
    expect(
      hasRequiredPolicyMetadata(
        {
          ...READY_METADATA,
          parameters: {
            ...CURRENT_LAW_METADATA,
            [parameter.name]: {
              ...CURRENT_LAW_METADATA[parameter.name],
              values,
            },
          },
        },
        'us',
        [parameter]
      )
    ).toBe(false);
  });

  test('given current-law values begin after a proposed interval then returns false', () => {
    expect(
      hasRequiredPolicyMetadata(
        {
          ...READY_METADATA,
          parameters: {
            ...CURRENT_LAW_METADATA,
            [parameter.name]: {
              ...CURRENT_LAW_METADATA[parameter.name],
              values: { '2027-01-01': 200 },
            },
          },
        },
        'us',
        [parameter]
      )
    ).toBe(false);
  });

  test('given a proposed interval has invalid dates then returns false', () => {
    expect(
      hasRequiredPolicyMetadata(READY_METADATA, 'us', [
        createParameter(parameter.name, '2026-02-30', '2026-12-31', 150),
      ])
    ).toBe(false);
  });
});

describe('policyValuesEqual', () => {
  test.each([
    [0, 0],
    [false, false],
    [null, null],
    ['current', 'current'],
    [
      { enabled: true, programs: ['employment_income', 'self_employment_income'] },
      { programs: ['employment_income', 'self_employment_income'], enabled: true },
    ],
  ])('given structurally equal values then returns true', (left, right) => {
    expect(policyValuesEqual(left, right)).toBe(true);
  });

  test.each([
    [0, false],
    [false, 0],
    [false, true],
    [
      [1, 2],
      [2, 1],
    ],
    [{ value: 1 }, { value: 2 }],
  ])('given distinct values then returns false without coercion', (left, right) => {
    expect(policyValuesEqual(left, right)).toBe(false);
  });
});

describe('normalizeParameterIntervals', () => {
  test('given a value that matches current law throughout then removes the interval', () => {
    const result = normalizeParameterIntervals(
      [{ startDate: '2025-01-01', endDate: '2025-12-31', value: 100 }],
      CURRENT_LAW_METADATA[TEST_PARAMETER_NAMES.changingAmount].values
    );

    expect(result).toEqual([]);
  });

  test('given current law changes inside a proposal then retains only the differing dates', () => {
    const result = normalizeParameterIntervals(
      [{ startDate: '2025-01-01', endDate: '2028-12-31', value: 100 }],
      CURRENT_LAW_METADATA[TEST_PARAMETER_NAMES.changingAmount].values
    );

    expect(result).toEqual([{ startDate: '2026-07-01', endDate: '2027-12-31', value: 100 }]);
  });

  test('given a proposal starts before known current law then conservatively retains that portion', () => {
    const result = normalizeParameterIntervals(
      [{ startDate: '2024-01-01', endDate: '2025-12-31', value: 100 }],
      { '2025-01-01': 100 }
    );

    expect(result).toEqual([{ startDate: '2024-01-01', endDate: '2024-12-31', value: 100 }]);
  });

  test('given adjacent differing proposals with equal values then merges them', () => {
    const result = normalizeParameterIntervals(
      [
        { startDate: '2025-01-01', endDate: '2025-12-31', value: 150 },
        { startDate: '2026-01-01', endDate: '2026-12-31', value: 150 },
      ],
      { '2020-01-01': 100 }
    );

    expect(result).toEqual([{ startDate: '2025-01-01', endDate: '2026-12-31', value: 150 }]);
  });

  test('given missing metadata then preserves the proposed interval', () => {
    const interval = { startDate: '2025-01-01', endDate: '2025-12-31', value: 100 };

    expect(normalizeParameterIntervals([interval], undefined)).toEqual([interval]);
  });

  test('given structured values with different key order then removes the no-op interval', () => {
    const result = normalizeParameterIntervals(
      [
        {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          value: {
            enabled: true,
            programs: ['employment_income', 'self_employment_income'],
          },
        },
      ],
      CURRENT_LAW_METADATA[TEST_PARAMETER_NAMES.structuredValue].values
    );

    expect(result).toEqual([]);
  });
});

describe('normalizePolicyParameters', () => {
  test('given default, yearly, date-range, and multi-year values then keeps only effective changes', () => {
    const parameters = [
      createParameter(TEST_PARAMETER_NAMES.changingAmount, '2025-01-01', '2025-12-31', 100),
      {
        name: TEST_PARAMETER_NAMES.zeroAmount,
        values: [
          { startDate: '2025-01-01', endDate: '2025-12-31', value: 0 },
          { startDate: '2026-01-01', endDate: '2026-12-31', value: 10 },
          { startDate: '2027-01-01', endDate: '2027-12-31', value: 0 },
        ],
      },
      createParameter(TEST_PARAMETER_NAMES.booleanSetting, '2025-04-01', '2025-09-30', true),
    ];

    const result = normalizePolicyParameters(parameters, CURRENT_LAW_METADATA);

    expect(result).toEqual([
      {
        name: TEST_PARAMETER_NAMES.zeroAmount,
        values: [{ startDate: '2026-01-01', endDate: '2026-12-31', value: 10 }],
      },
      {
        name: TEST_PARAMETER_NAMES.booleanSetting,
        values: [{ startDate: '2025-04-01', endDate: '2025-09-30', value: true }],
      },
    ]);
  });

  test('given false and zero that match current law then removes both parameters', () => {
    const result = normalizePolicyParameters(
      [
        createParameter(TEST_PARAMETER_NAMES.booleanSetting, '2025-01-01', '2025-12-31', false),
        createParameter(TEST_PARAMETER_NAMES.zeroAmount, '2025-01-01', '2025-12-31', 0),
      ],
      CURRENT_LAW_METADATA
    );

    expect(result).toEqual([]);
  });

  test('given a parameter without metadata then preserves it', () => {
    const parameter = createParameter(
      TEST_PARAMETER_NAMES.missingMetadata,
      '2025-01-01',
      '2025-12-31',
      0
    );

    expect(normalizePolicyParameters([parameter], CURRENT_LAW_METADATA)).toEqual([parameter]);
  });

  test('given normalization then does not mutate the source parameters', () => {
    const parameter = createParameter(
      TEST_PARAMETER_NAMES.changingAmount,
      '2025-01-01',
      '2028-12-31',
      100
    );
    const original = structuredClone(parameter);

    normalizePolicyParameters([parameter], CURRENT_LAW_METADATA);

    expect(parameter).toEqual(original);
  });

  test('given only current-law values then reports no effective changes', () => {
    const parameters = [
      createParameter(TEST_PARAMETER_NAMES.zeroAmount, '2025-01-01', '2025-12-31', 0),
    ];

    expect(hasEffectivePolicyChanges(parameters, CURRENT_LAW_METADATA)).toBe(false);
  });

  test('given only current-law values then defensive validation rejects the policy', () => {
    const parameters = [
      createParameter(TEST_PARAMETER_NAMES.zeroAmount, '2025-01-01', '2025-12-31', 0),
    ];

    expect(() => requireEffectivePolicyParameters(parameters, CURRENT_LAW_METADATA)).toThrow(
      NoEffectivePolicyChangesError
    );
  });
});
