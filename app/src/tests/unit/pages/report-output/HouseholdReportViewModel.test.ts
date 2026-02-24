import { describe, expect, test } from 'vitest';
import type { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
import { HouseholdReportViewModel } from '@/pages/report-output/HouseholdReportViewModel';
import {
  MOCK_CALC_STATUS_BASELINE_COMPLETE,
  MOCK_CALC_STATUS_REFORM_COMPLETE,
  MOCK_HOUSEHOLD_BASELINE_RESULT,
  MOCK_HOUSEHOLD_REFORM_RESULT,
  MOCK_REPORT,
  MOCK_SIMULATION_BASELINE,
  MOCK_SIMULATION_REFORM,
  MOCK_USER_POLICY_BASELINE,
  MOCK_USER_POLICY_REFORM,
} from '@/tests/fixtures/pages/report-output/HouseholdReportOutput';
import type { CalcStatus } from '@/types/calculation';

describe('HouseholdReportViewModel', () => {
  describe('simulationIds', () => {
    test('given simulations with IDs then returns all IDs', () => {
      const vm = new HouseholdReportViewModel(
        MOCK_REPORT,
        [MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM],
        []
      );

      expect(vm.simulationIds).toEqual(['sim-1', 'sim-2']);
    });

    test('given no simulations then returns empty array', () => {
      const vm = new HouseholdReportViewModel(MOCK_REPORT, undefined, []);

      expect(vm.simulationIds).toEqual([]);
    });

    test('given simulations with undefined IDs then filters them out', () => {
      const simWithNoId = { ...MOCK_SIMULATION_BASELINE, id: undefined as unknown as string };
      const vm = new HouseholdReportViewModel(MOCK_REPORT, [simWithNoId, MOCK_SIMULATION_REFORM], []);

      expect(vm.simulationIds).toEqual(['sim-2']);
    });
  });

  describe('getOutputsFromCalcResults', () => {
    test('given single baseline-only result then extracts baseline_result', () => {
      const vm = new HouseholdReportViewModel(MOCK_REPORT, [MOCK_SIMULATION_BASELINE], []);
      const outputs = vm.getOutputsFromCalcResults([MOCK_CALC_STATUS_BASELINE_COMPLETE]);

      expect(outputs).toHaveLength(1);
      expect(outputs[0]).toEqual(MOCK_HOUSEHOLD_BASELINE_RESULT);
    });

    test('given reform result then prefers reform_result over baseline_result', () => {
      const vm = new HouseholdReportViewModel(MOCK_REPORT, [MOCK_SIMULATION_REFORM], []);
      const outputs = vm.getOutputsFromCalcResults([MOCK_CALC_STATUS_REFORM_COMPLETE]);

      expect(outputs).toHaveLength(1);
      expect(outputs[0]).toEqual(MOCK_HOUSEHOLD_REFORM_RESULT);
    });

    test('given multiple complete calculations then extracts all outputs', () => {
      const vm = new HouseholdReportViewModel(
        MOCK_REPORT,
        [MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM],
        []
      );
      const outputs = vm.getOutputsFromCalcResults([
        MOCK_CALC_STATUS_BASELINE_COMPLETE,
        MOCK_CALC_STATUS_REFORM_COMPLETE,
      ]);

      expect(outputs).toHaveLength(2);
    });

    test('given incomplete calculation then skips it', () => {
      const pendingCalc: CalcStatus = {
        status: 'pending',
        metadata: {
          calcId: 'sim-1',
          targetType: 'simulation',
          calcType: 'household',
          startedAt: Date.now(),
        },
      };
      const vm = new HouseholdReportViewModel(MOCK_REPORT, [MOCK_SIMULATION_BASELINE], []);
      const outputs = vm.getOutputsFromCalcResults([pendingCalc]);

      expect(outputs).toHaveLength(0);
    });

    test('given calculation with null result then skips it', () => {
      const nullResponse: HouseholdImpactResponse = {
        report_id: 'test-report',
        report_type: 'household',
        status: 'completed',
        baseline_simulation: null,
        reform_simulation: null,
        baseline_result: null,
        reform_result: null,
        impact: null,
        error_message: null,
      };
      const calcWithNullResult: CalcStatus = {
        status: 'complete',
        result: nullResponse,
        metadata: {
          calcId: 'sim-1',
          targetType: 'simulation',
          calcType: 'household',
          startedAt: Date.now(),
        },
      };
      const vm = new HouseholdReportViewModel(MOCK_REPORT, [MOCK_SIMULATION_BASELINE], []);
      const outputs = vm.getOutputsFromCalcResults([calcWithNullResult]);

      expect(outputs).toHaveLength(0);
    });
  });

  describe('getFormattedOutput', () => {
    test('given single simulation then returns single Household object', () => {
      const vm = new HouseholdReportViewModel(MOCK_REPORT, [MOCK_SIMULATION_BASELINE], []);
      const output = vm.getFormattedOutput([MOCK_CALC_STATUS_BASELINE_COMPLETE]);

      expect(output).toEqual(MOCK_HOUSEHOLD_BASELINE_RESULT);
      expect(Array.isArray(output)).toBe(false);
    });

    test('given multiple simulations then returns array', () => {
      const vm = new HouseholdReportViewModel(
        MOCK_REPORT,
        [MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM],
        []
      );
      const output = vm.getFormattedOutput([
        MOCK_CALC_STATUS_BASELINE_COMPLETE,
        MOCK_CALC_STATUS_REFORM_COMPLETE,
      ]);

      expect(Array.isArray(output)).toBe(true);
      expect(output).toHaveLength(2);
    });

    test('given no complete results then returns null', () => {
      const vm = new HouseholdReportViewModel(MOCK_REPORT, [MOCK_SIMULATION_BASELINE], []);
      const output = vm.getFormattedOutput([]);

      expect(output).toBeNull();
    });
  });

  describe('getPolicyLabels', () => {
    test('given matching user policies then returns labels', () => {
      const vm = new HouseholdReportViewModel(
        MOCK_REPORT,
        [MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM],
        [MOCK_USER_POLICY_BASELINE, MOCK_USER_POLICY_REFORM]
      );

      expect(vm.getPolicyLabels()).toEqual(['My Baseline', 'My Reform']);
    });

    test('given missing user policy then falls back to Policy ID', () => {
      const vm = new HouseholdReportViewModel(
        MOCK_REPORT,
        [MOCK_SIMULATION_BASELINE, MOCK_SIMULATION_REFORM],
        [MOCK_USER_POLICY_BASELINE] // Only baseline user policy
      );

      expect(vm.getPolicyLabels()).toEqual(['My Baseline', 'Policy policy-2']);
    });

    test('given no simulations then returns empty array', () => {
      const vm = new HouseholdReportViewModel(MOCK_REPORT, undefined, []);

      expect(vm.getPolicyLabels()).toEqual([]);
    });

    test('given no user policies then returns empty array', () => {
      const vm = new HouseholdReportViewModel(
        MOCK_REPORT,
        [MOCK_SIMULATION_BASELINE],
        undefined
      );

      expect(vm.getPolicyLabels()).toEqual([]);
    });
  });

  describe('getErrorMessage', () => {
    test('given error with message then returns message', () => {
      const vm = new HouseholdReportViewModel(MOCK_REPORT, [], []);
      const error = { message: 'Server error', code: 'ERR', retryable: false };

      expect(vm.getErrorMessage(error)).toBe('Server error');
    });

    test('given no error then returns default message', () => {
      const vm = new HouseholdReportViewModel(MOCK_REPORT, [], []);

      expect(vm.getErrorMessage(undefined)).toBe('Calculation failed');
    });
  });
});
