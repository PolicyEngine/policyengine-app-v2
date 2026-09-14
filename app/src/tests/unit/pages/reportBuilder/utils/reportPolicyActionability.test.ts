import { describe, expect, test } from 'vitest';
import {
  getReportPolicyActionability,
  REPORT_POLICIES_IDENTICAL_MESSAGE,
  REPORT_POLICY_LOADING_MESSAGE,
  REPORT_REQUIRES_POLICY_CHANGE_MESSAGE,
} from '@/pages/reportBuilder/utils/reportPolicyActionability';
import {
  createParameter,
  CURRENT_LAW_METADATA,
  TEST_PARAMETER_NAMES,
} from '@/tests/fixtures/utils/policyCurrentLawMocks';
import type { SimulationStateProps } from '@/types/pathwayState';

function simulation(
  id: string,
  parameters: SimulationStateProps['policy']['parameters']
): SimulationStateProps {
  return {
    label: id,
    policy: { id, label: id, parameters },
    population: {
      label: 'United States',
      type: 'geography' as const,
      geography: {
        id: 'us',
        geographyId: 'us',
        countryId: 'us',
        scope: 'national' as const,
      },
      household: null,
    },
  };
}

const changedAmount = createParameter(
  TEST_PARAMETER_NAMES.changingAmount,
  '2025-01-01',
  '2025-12-31',
  150
);

describe('getReportPolicyActionability', () => {
  test('given a one-simulation current-law report then it requires an effective policy change', () => {
    const result = getReportPolicyActionability({
      simulations: [simulation('current-law', [])],
      currentLawMetadata: CURRENT_LAW_METADATA,
      metadataReady: true,
    });

    expect(result).toMatchObject({
      isActionable: false,
      reason: 'no-effective-policy-change',
      message: REPORT_REQUIRES_POLICY_CHANGE_MESSAGE,
    });
  });

  test('given one effective reform then it is actionable and exposes its normalized parameters', () => {
    const result = getReportPolicyActionability({
      simulations: [simulation('policy-1', [changedAmount])],
      currentLawMetadata: CURRENT_LAW_METADATA,
      metadataReady: true,
    });

    expect(result).toMatchObject({ isActionable: true, reason: null });
    expect(result.normalizedPolicies).toEqual([[changedAmount]]);
  });

  test.each([
    ['two current-law policies', simulation('current-law', []), simulation('current-law', [])],
    [
      'the same saved policy',
      simulation('policy-1', [changedAmount]),
      simulation('policy-1', [changedAmount]),
    ],
    [
      'different IDs with identical overrides',
      simulation('policy-1', [changedAmount]),
      simulation('policy-2', [structuredClone(changedAmount)]),
    ],
  ])('given %s then the comparison is non-actionable', (_label, first, second) => {
    const result = getReportPolicyActionability({
      simulations: [first, second],
      currentLawMetadata: CURRENT_LAW_METADATA,
      metadataReady: true,
    });

    expect(result).toMatchObject({
      isActionable: false,
      reason: 'identical-policy-configurations',
      message: REPORT_POLICIES_IDENTICAL_MESSAGE,
    });
  });

  test('given current law changes inside the proposed range then differing dates make the comparison actionable', () => {
    const result = getReportPolicyActionability({
      simulations: [
        simulation('current-law', []),
        simulation('policy-1', [
          createParameter(TEST_PARAMETER_NAMES.changingAmount, '2025-01-01', '2028-12-31', 100),
        ]),
      ],
      currentLawMetadata: CURRENT_LAW_METADATA,
      metadataReady: true,
    });

    expect(result.isActionable).toBe(true);
    expect(result.normalizedPolicies[1]).toEqual([
      createParameter(TEST_PARAMETER_NAMES.changingAmount, '2026-07-01', '2027-12-31', 100),
    ]);
  });

  test('given Boolean false and numeric zero match current law then they remain distinct values but are both no-ops', () => {
    const result = getReportPolicyActionability({
      simulations: [
        simulation('policy-1', [
          createParameter(TEST_PARAMETER_NAMES.booleanSetting, '2025-01-01', '2025-12-31', false),
          createParameter(TEST_PARAMETER_NAMES.zeroAmount, '2025-01-01', '2025-12-31', 0),
        ]),
      ],
      currentLawMetadata: CURRENT_LAW_METADATA,
      metadataReady: true,
    });

    expect(result.isActionable).toBe(false);
  });

  test.each([
    ['metadata is loading', false, simulation('policy-1', [changedAmount])],
    ['saved policy contents are placeholders', true, simulation('policy-1', [{} as any])],
    [
      'parameter metadata is missing',
      true,
      simulation('policy-1', [
        createParameter(TEST_PARAMETER_NAMES.missingMetadata, '2025-01-01', '2025-12-31', 1),
      ]),
    ],
  ])('given %s then actionability fails closed', (_label, metadataReady, selectedSimulation) => {
    const result = getReportPolicyActionability({
      simulations: [selectedSimulation],
      currentLawMetadata: CURRENT_LAW_METADATA,
      metadataReady,
    });

    expect(result).toMatchObject({
      isActionable: false,
      reason: 'policy-data-unavailable',
      message: REPORT_POLICY_LOADING_MESSAGE,
    });
  });
});
