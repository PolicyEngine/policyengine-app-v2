import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import reportReducer, {
  addSimulationId,
  clearReport,
  markReportAsComplete,
  markReportAsError,
  removeSimulationId,
  updateApiVersion,
  updateCountryId,
  updateLabel,
  updateReportId,
  updateReportOutput,
  updateReportStatus,
  updateTimestamps,
} from '@/reducers/reportReducer';
import {
  createMockReportState,
  EXPECTED_INITIAL_STATE,
  expectOutput,
  expectReportId,
  expectSimulationIds,
  expectStateToEqual,
  expectStatus,
  expectTimestampsUpdated,
  MOCK_COMPLETE_REPORT,
  MOCK_ERROR_REPORT,
  MOCK_PENDING_REPORT,
  MOCK_REPORT_OUTPUT,
  MOCK_REPORT_OUTPUT_ALTERNATIVE,
  TEST_REPORT_ID_1,
  TEST_REPORT_ID_2,
  TEST_SIMULATION_ID_1,
  TEST_SIMULATION_ID_2,
  TEST_SIMULATION_ID_3,
} from '@/tests/fixtures/reducers/reportReducerMocks';

describe('reportReducer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to ensure consistent timestamps in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    test('given no action then returns initial state', () => {
      // Given
      const action = { type: 'unknown/action' };

      // When
      const state = reportReducer(undefined, action);

      // Then
      expectStateToEqual(state, EXPECTED_INITIAL_STATE);
    });
  });

  describe('addSimulationId action', () => {
    test('given new simulation id then adds to list', () => {
      // Given
      const initialState = createMockReportState();
      vi.advanceTimersByTime(1000); // Advance time to ensure different timestamp
      const action = addSimulationId(TEST_SIMULATION_ID_2);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectSimulationIds(state, [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2]);
      expectTimestampsUpdated(state, initialState);
    });

    test('given duplicate simulation id then does not add to list', () => {
      // Given
      const initialState = createMockReportState({
        simulationIds: [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2],
      });
      const action = addSimulationId(TEST_SIMULATION_ID_1);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectSimulationIds(state, [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2]);
      expect(state.updatedAt).toBe(initialState.updatedAt);
    });

    test('given empty simulationIds array then adds first id', () => {
      // Given
      const initialState = createMockReportState({ simulationIds: [] });
      vi.advanceTimersByTime(1000);
      const action = addSimulationId(TEST_SIMULATION_ID_1);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectSimulationIds(state, [TEST_SIMULATION_ID_1]);
      expectTimestampsUpdated(state, initialState);
    });
  });

  describe('removeSimulationId action', () => {
    test('given existing simulation id then removes from list', () => {
      // Given
      const initialState = createMockReportState({
        simulationIds: [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2, TEST_SIMULATION_ID_3],
      });
      vi.advanceTimersByTime(1000);
      const action = removeSimulationId(TEST_SIMULATION_ID_2);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectSimulationIds(state, [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_3]);
      expectTimestampsUpdated(state, initialState);
    });

    test('given non-existent simulation id then keeps list unchanged', () => {
      // Given
      const initialState = createMockReportState({
        simulationIds: [TEST_SIMULATION_ID_1],
      });
      vi.advanceTimersByTime(1000);
      const action = removeSimulationId(TEST_SIMULATION_ID_2);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectSimulationIds(state, [TEST_SIMULATION_ID_1]);
      expectTimestampsUpdated(state, initialState);
    });

    test('given last simulation id then results in empty list', () => {
      // Given
      const initialState = createMockReportState({
        simulationIds: [TEST_SIMULATION_ID_1],
      });
      vi.advanceTimersByTime(1000);
      const action = removeSimulationId(TEST_SIMULATION_ID_1);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectSimulationIds(state, []);
      expectTimestampsUpdated(state, initialState);
    });
  });

  describe('updateLabel action', () => {
    test('given new label then updates label', () => {
      // Given
      const initialState = createMockReportState({ label: null });
      vi.advanceTimersByTime(1000);
      const action = updateLabel('My Custom Report');

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.label).toBe('My Custom Report');
      expectTimestampsUpdated(state, initialState);
    });

    test('given null label then sets to null', () => {
      // Given
      const initialState = createMockReportState({ label: 'Old Label' });
      vi.advanceTimersByTime(1000);
      const action = updateLabel(null);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.label).toBe(null);
      expectTimestampsUpdated(state, initialState);
    });

    test('given empty string then updates to empty string', () => {
      // Given
      const initialState = createMockReportState({ label: 'Old Label' });
      vi.advanceTimersByTime(1000);
      const action = updateLabel('');

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.label).toBe('');
      expectTimestampsUpdated(state, initialState);
    });
  });

  describe('clearReport action', () => {
    test('given populated report then resets to initial state but preserves country and api version', () => {
      // Given
      const initialState = MOCK_COMPLETE_REPORT;
      const action = clearReport();

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectReportId(state, '');
      expect(state.label).toBe(null);
      expectSimulationIds(state, []);
      expectStatus(state, 'pending');
      expectOutput(state, null);
      expect(state.countryId).toBe('us'); // Preserved
      expect(state.apiVersion).toBe('v1'); // Preserved
      expect(state.createdAt).toBe('2024-01-15T10:00:00.000Z');
      expect(state.updatedAt).toBe('2024-01-15T10:00:00.000Z');
    });

    test('given error report then resets all fields but preserves country and api version', () => {
      // Given
      const initialState = MOCK_ERROR_REPORT;
      const action = clearReport();

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectReportId(state, '');
      expectSimulationIds(state, []);
      expectStatus(state, 'pending');
      expectOutput(state, null);
      expect(state.countryId).toBe('uk'); // Preserved
      expect(state.apiVersion).toBe('v2'); // Preserved
    });
  });

  describe('updateReportId action', () => {
    test('given new report id then updates id', () => {
      // Given
      const initialState = createMockReportState();
      vi.advanceTimersByTime(1000);
      const action = updateReportId(TEST_REPORT_ID_2);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectReportId(state, TEST_REPORT_ID_2);
      expectTimestampsUpdated(state, initialState);
    });

    test('given empty report id then sets empty string', () => {
      // Given
      const initialState = createMockReportState({ reportId: TEST_REPORT_ID_1 });
      vi.advanceTimersByTime(1000);
      const action = updateReportId('');

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectReportId(state, '');
      expectTimestampsUpdated(state, initialState);
    });
  });

  describe('updateReportStatus action', () => {
    test('given pending status then updates to pending', () => {
      // Given
      const initialState = createMockReportState({ status: 'complete' });
      vi.advanceTimersByTime(1000);
      const action = updateReportStatus('pending');

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectStatus(state, 'pending');
      expectTimestampsUpdated(state, initialState);
    });

    test('given complete status then updates to complete', () => {
      // Given
      const initialState = MOCK_PENDING_REPORT;
      vi.advanceTimersByTime(1000);
      const action = updateReportStatus('complete');

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectStatus(state, 'complete');
      expectTimestampsUpdated(state, initialState);
    });

    test('given error status then updates to error', () => {
      // Given
      const initialState = MOCK_PENDING_REPORT;
      vi.advanceTimersByTime(1000);
      const action = updateReportStatus('error');

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectStatus(state, 'error');
      expectTimestampsUpdated(state, initialState);
    });
  });

  describe('updateReportOutput action', () => {
    test('given report output then sets output', () => {
      // Given
      const initialState = MOCK_PENDING_REPORT;
      vi.advanceTimersByTime(1000);
      const action = updateReportOutput(MOCK_REPORT_OUTPUT);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectOutput(state, MOCK_REPORT_OUTPUT);
      expectTimestampsUpdated(state, initialState);
    });

    test('given null output then clears output', () => {
      // Given
      const initialState = MOCK_COMPLETE_REPORT;
      vi.advanceTimersByTime(1000);
      const action = updateReportOutput(null);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectOutput(state, null);
      expectTimestampsUpdated(state, initialState);
    });

    test('given different output then replaces existing output', () => {
      // Given
      const initialState = createMockReportState({ output: MOCK_REPORT_OUTPUT });
      vi.advanceTimersByTime(1000);
      const action = updateReportOutput(MOCK_REPORT_OUTPUT_ALTERNATIVE);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectOutput(state, MOCK_REPORT_OUTPUT_ALTERNATIVE);
      expectTimestampsUpdated(state, initialState);
    });
  });

  describe('markReportAsComplete action', () => {
    test('given pending report then marks as complete', () => {
      // Given
      const initialState = MOCK_PENDING_REPORT;
      vi.advanceTimersByTime(1000);
      const action = markReportAsComplete();

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectStatus(state, 'complete');
      expectTimestampsUpdated(state, initialState);
    });

    test('given error report then marks as complete', () => {
      // Given
      const initialState = MOCK_ERROR_REPORT;
      vi.advanceTimersByTime(1000);
      const action = markReportAsComplete();

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectStatus(state, 'complete');
      expectTimestampsUpdated(state, initialState);
    });

    test('given already complete report then remains complete', () => {
      // Given
      const initialState = MOCK_COMPLETE_REPORT;
      vi.advanceTimersByTime(1000);
      const action = markReportAsComplete();

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectStatus(state, 'complete');
      expectTimestampsUpdated(state, initialState);
    });
  });

  describe('markReportAsError action', () => {
    test('given pending report then marks as error', () => {
      // Given
      const initialState = MOCK_PENDING_REPORT;
      vi.advanceTimersByTime(1000);
      const action = markReportAsError();

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectStatus(state, 'error');
      expectTimestampsUpdated(state, initialState);
    });

    test('given complete report then marks as error', () => {
      // Given
      const initialState = MOCK_COMPLETE_REPORT;
      vi.advanceTimersByTime(1000);
      const action = markReportAsError();

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectStatus(state, 'error');
      expectTimestampsUpdated(state, initialState);
    });

    test('given already error report then remains error', () => {
      // Given
      const initialState = MOCK_ERROR_REPORT;
      vi.advanceTimersByTime(1000);
      const action = markReportAsError();

      // When
      const state = reportReducer(initialState, action);

      // Then
      expectStatus(state, 'error');
      expectTimestampsUpdated(state, initialState);
    });
  });

  describe('updateApiVersion action', () => {
    test('given new api version then updates version', () => {
      // Given
      const initialState = createMockReportState();
      const action = updateApiVersion('v2');

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.apiVersion).toBe('v2');
    });

    test('given null api version then sets to null', () => {
      // Given
      const initialState = createMockReportState({ apiVersion: 'v1' });
      const action = updateApiVersion(null);

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.apiVersion).toBeNull();
    });
  });

  describe('updateCountryId action', () => {
    test('given new country id then updates country', () => {
      // Given
      const initialState = createMockReportState({ countryId: 'us' });
      const action = updateCountryId('uk');

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.countryId).toBe('uk');
    });

    test('given different country id then updates country', () => {
      // Given
      const initialState = createMockReportState({ countryId: 'uk' });
      const action = updateCountryId('ca');

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.countryId).toBe('ca');
    });
  });

  describe('updateTimestamps action', () => {
    test('given createdAt only then updates createdAt', () => {
      // Given
      const initialState = createMockReportState();
      const newCreatedAt = '2024-02-01T12:00:00.000Z';
      const action = updateTimestamps({ createdAt: newCreatedAt });

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.createdAt).toBe(newCreatedAt);
      expect(state.updatedAt).toBe(initialState.updatedAt);
    });

    test('given updatedAt only then updates updatedAt', () => {
      // Given
      const initialState = createMockReportState();
      const newUpdatedAt = '2024-02-01T14:00:00.000Z';
      const action = updateTimestamps({ updatedAt: newUpdatedAt });

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.createdAt).toBe(initialState.createdAt);
      expect(state.updatedAt).toBe(newUpdatedAt);
    });

    test('given both timestamps then updates both', () => {
      // Given
      const initialState = createMockReportState();
      const newCreatedAt = '2024-02-01T12:00:00.000Z';
      const newUpdatedAt = '2024-02-01T14:00:00.000Z';
      const action = updateTimestamps({
        createdAt: newCreatedAt,
        updatedAt: newUpdatedAt,
      });

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.createdAt).toBe(newCreatedAt);
      expect(state.updatedAt).toBe(newUpdatedAt);
    });

    test('given empty object then keeps timestamps unchanged', () => {
      // Given
      const initialState = createMockReportState();
      const action = updateTimestamps({});

      // When
      const state = reportReducer(initialState, action);

      // Then
      expect(state.createdAt).toBe(initialState.createdAt);
      expect(state.updatedAt).toBe(initialState.updatedAt);
    });
  });

  describe('state transitions', () => {
    test('given sequence of actions then maintains correct state', () => {
      // Given
      let state = EXPECTED_INITIAL_STATE;

      // When & Then - Update report ID
      state = reportReducer(state, updateReportId(TEST_REPORT_ID_1));
      expectReportId(state, TEST_REPORT_ID_1);

      // When & Then - Add simulation IDs
      state = reportReducer(state, addSimulationId(TEST_SIMULATION_ID_1));
      state = reportReducer(state, addSimulationId(TEST_SIMULATION_ID_2));
      expectSimulationIds(state, [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2]);

      // When & Then - Update output
      state = reportReducer(state, updateReportOutput(MOCK_REPORT_OUTPUT));
      expectOutput(state, MOCK_REPORT_OUTPUT);

      // When & Then - Mark as complete
      state = reportReducer(state, markReportAsComplete());
      expectStatus(state, 'complete');

      // When & Then - Remove a simulation
      state = reportReducer(state, removeSimulationId(TEST_SIMULATION_ID_1));
      expectSimulationIds(state, [TEST_SIMULATION_ID_2]);

      // When & Then - Mark as error
      state = reportReducer(state, markReportAsError());
      expectStatus(state, 'error');

      // When & Then - Clear report
      state = reportReducer(state, clearReport());
      expectReportId(state, '');
      expectSimulationIds(state, []);
      expectStatus(state, 'pending');
      expectOutput(state, null);
    });

    test('given complex workflow then handles all state changes correctly', () => {
      // Given - Start with empty report
      let state = reportReducer(undefined, { type: 'init' });

      // When - Setup new report
      state = reportReducer(state, updateReportId(TEST_REPORT_ID_1));
      state = reportReducer(state, addSimulationId(TEST_SIMULATION_ID_1));
      state = reportReducer(state, addSimulationId(TEST_SIMULATION_ID_2));

      // Then - Verify initial setup
      expectReportId(state, TEST_REPORT_ID_1);
      expectSimulationIds(state, [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2]);
      expectStatus(state, 'pending');

      // When - Complete report with output
      state = reportReducer(state, updateReportOutput(MOCK_REPORT_OUTPUT));
      state = reportReducer(state, markReportAsComplete());

      // Then - Verify completion
      expectStatus(state, 'complete');
      expectOutput(state, MOCK_REPORT_OUTPUT);

      // When - Error occurs, need to retry
      state = reportReducer(state, markReportAsError());
      state = reportReducer(state, updateReportOutput(null));

      // Then - Verify error state
      expectStatus(state, 'error');
      expectOutput(state, null);

      // When - Retry with new simulation
      state = reportReducer(state, updateReportStatus('pending'));
      state = reportReducer(state, addSimulationId(TEST_SIMULATION_ID_3));
      state = reportReducer(state, updateReportOutput(MOCK_REPORT_OUTPUT_ALTERNATIVE));
      state = reportReducer(state, markReportAsComplete());

      // Then - Verify successful retry
      expectStatus(state, 'complete');
      expectOutput(state, MOCK_REPORT_OUTPUT_ALTERNATIVE);
      expectSimulationIds(state, [
        TEST_SIMULATION_ID_1,
        TEST_SIMULATION_ID_2,
        TEST_SIMULATION_ID_3,
      ]);
    });
  });

  describe('edge cases', () => {
    test('given multiple duplicate simulation ids then only adds once', () => {
      // Given
      const initialState = createMockReportState({ simulationIds: [] });

      // When
      let state = reportReducer(initialState, addSimulationId(TEST_SIMULATION_ID_1));
      state = reportReducer(state, addSimulationId(TEST_SIMULATION_ID_1));
      state = reportReducer(state, addSimulationId(TEST_SIMULATION_ID_1));

      // Then
      expectSimulationIds(state, [TEST_SIMULATION_ID_1]);
    });

    test('given remove all simulations then results in empty array', () => {
      // Given
      const initialState = createMockReportState({
        simulationIds: [TEST_SIMULATION_ID_1, TEST_SIMULATION_ID_2, TEST_SIMULATION_ID_3],
      });

      // When
      let state = reportReducer(initialState, removeSimulationId(TEST_SIMULATION_ID_1));
      state = reportReducer(state, removeSimulationId(TEST_SIMULATION_ID_2));
      state = reportReducer(state, removeSimulationId(TEST_SIMULATION_ID_3));

      // Then
      expectSimulationIds(state, []);
    });

    test('given status transitions then all combinations work', () => {
      // Given
      const statuses: Array<'pending' | 'complete' | 'error'> = ['pending', 'complete', 'error'];

      statuses.forEach((fromStatus) => {
        statuses.forEach((toStatus) => {
          // When
          const initialState = createMockReportState({ status: fromStatus });
          const state = reportReducer(initialState, updateReportStatus(toStatus));

          // Then
          expectStatus(state, toStatus);
        });
      });
    });
  });
});
