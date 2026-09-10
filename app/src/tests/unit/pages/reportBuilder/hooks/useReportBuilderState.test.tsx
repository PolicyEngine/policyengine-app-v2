import { act, renderHook } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import { Household } from '@/models/Household';
import { useReportBuilderState } from '@/pages/reportBuilder/hooks/useReportBuilderState';
import { changeReportYear } from '@/pages/reportBuilder/utils/changeReportYear';
import {
  mismatchedOwnershipHydrationCases,
  OWNERSHIP_HYDRATION_ERRORS,
  ownershipHydrationData,
} from '@/tests/fixtures/spm/reportBuilderOwnershipMocks';

let countryId: 'us' | 'uk' = 'us';
let ownedData: Omit<ReturnType<typeof ownershipHydrationData>, 'error'> & {
  error: Error | null;
} = ownershipHydrationData('first');
let sharedData = ownershipHydrationData('shared-first');

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: () => countryId }));
vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useSelector: () => 1,
}));
vi.mock('@/hooks/useUserReports', () => ({ useUserReportById: () => ownedData }));
vi.mock('@/hooks/useSharedReportData', () => ({ useSharedReportData: () => sharedData }));

function shareInput(data: ReturnType<typeof ownershipHydrationData>): ReportIngredientsInput {
  return {
    userReport: data.userReport,
    userSimulations: [],
    userPolicies: [],
    userHouseholds: [],
    userGeographies: [],
  };
}

describe('useReportBuilderState source ownership', () => {
  beforeEach(() => {
    countryId = 'us';
    ownedData = ownershipHydrationData('first');
    sharedData = ownershipHydrationData('shared-first');
  });

  test('given a year-modified draft then switching reports hides old state and rejects stale setters before hydrating the new source', () => {
    const renderedStates: ReturnType<typeof useReportBuilderState>[] = [];
    const { result, rerender } = renderHook(
      ({ id }) => {
        const state = useReportBuilderState(id);
        renderedStates.push(state);
        return state;
      },
      { initialProps: { id: ownedData.userReport.id } }
    );
    const staleSetter = result.current.setReportState;
    act(() => staleSetter((state) => changeReportYear(state!, '2023')));
    expect(result.current.reportState?.year).toBe('2023');
    expect(result.current.originalState?.year).toBe('2026');
    expect(result.current.originalState?.simulations[0].population.household).toBeInstanceOf(
      Household
    );
    rerender({ id: ownedData.userReport.id });
    expect(result.current.reportState?.year).toBe('2023');

    // Retained query data for the previous route must never become the new draft.
    const rendersBeforeSwitch = renderedStates.length;
    ownedData = { ...ownedData, isLoading: true };
    rerender({ id: 'second-association' });
    expect(renderedStates[rendersBeforeSwitch].reportState).toBeNull();
    expect(renderedStates[rendersBeforeSwitch].originalState).toBeNull();
    expect(result.current.reportState).toBeNull();
    expect(result.current.originalState).toBeNull();
    expect(result.current.isLoading).toBe(true);
    ownedData = { ...ownedData, isLoading: false };
    rerender({ id: 'second-association' });
    expect(result.current.reportState).toBeNull();

    ownedData = ownershipHydrationData('second');
    rerender({ id: ownedData.userReport.id });
    expect(result.current.reportState?.id).toBe('second-association');
    expect(result.current.reportState?.year).toBe('2026');
    expect(result.current.originalState?.simulations[1].population.household).toBeInstanceOf(
      Household
    );
    act(() => staleSetter((state) => ({ ...state!, year: '2022' })));
    expect(result.current.reportState?.year).toBe('2026');
  });

  test('given a country switch with identical IDs then hides the previous country until its replacement has loaded', () => {
    const { result, rerender } = renderHook(() => useReportBuilderState('first-association'));
    act(() => result.current.setReportState((state) => changeReportYear(state!, '2023')));
    countryId = 'uk';
    rerender();
    expect(result.current.reportState).toBeNull();
    expect(result.current.originalState).toBeNull();

    ownedData = ownershipHydrationData('first', 'uk');
    rerender();
    expect(result.current.reportState?.simulations[0].population.household?.countryId).toBe('uk');
    expect(result.current.reportState?.year).toBe('2026');
    expect(result.current.originalState?.simulations[0].population.household).toBeInstanceOf(
      Household
    );
  });

  test('given a different shared report then does not reuse the previous shared draft while inputs resolve', () => {
    const { result, rerender } = renderHook(({ share }) => useReportBuilderState('', share), {
      initialProps: { share: shareInput(sharedData) },
    });
    const second = ownershipHydrationData('shared-second');
    rerender({ share: shareInput(second) });
    expect(result.current.reportState).toBeNull();
    expect(result.current.originalState).toBeNull();

    sharedData = second;
    rerender({ share: shareInput(second) });
    expect(result.current.reportState?.id).toBe(second.userReport.id);
    expect(result.current.originalState?.simulations[0].population.household).toBeInstanceOf(
      Household
    );
  });

  test('given the association points to a replacement base report then waits for matching inputs and starts a fresh original snapshot', () => {
    const { result, rerender } = renderHook(() => useReportBuilderState('first-association'));
    act(() => result.current.setReportState((state) => changeReportYear(state!, '2023')));
    ownedData = { ...ownedData, userReport: { ...ownedData.userReport, reportId: 'replacement' } };
    rerender();
    expect(result.current.reportState).toBeNull();

    ownedData = { ...ownershipHydrationData('replacement'), userReport: ownedData.userReport };
    rerender();
    expect(result.current.reportState?.year).toBe('2026');
    expect(result.current.reportState?.simulations[0].population.household?.id).toContain(
      'replacement'
    );
    expect(result.current.originalState?.simulations[1].population.household).toBeInstanceOf(
      Household
    );
  });

  test.each(mismatchedOwnershipHydrationCases)(
    'given loaded data for $name then reports a terminal error without an editable snapshot',
    ({ update }) => {
      ownedData = update(ownershipHydrationData('first'));

      const { result } = renderHook(() => useReportBuilderState('first-association'));

      expect(result.current.error?.message).toBe(OWNERSHIP_HYDRATION_ERRORS.source);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.reportState).toBeNull();
      expect(result.current.originalState).toBeNull();
    }
  );

  test.each(['owned', 'shared'])(
    'given a loaded %s report with no simulations then reports a terminal error',
    (source) => {
      ownedData = { ...ownedData, simulations: [] };
      sharedData = { ...sharedData, simulations: [] };

      const { result } = renderHook(() =>
        useReportBuilderState(
          'first-association',
          source === 'shared' ? shareInput(sharedData) : null
        )
      );

      expect(result.current.error?.message).toBe(OWNERSHIP_HYDRATION_ERRORS.empty);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.reportState).toBeNull();
      expect(result.current.originalState).toBeNull();
    }
  );

  test('given a shared association that does not round-trip then shows an error after loading completes', () => {
    const share = shareInput(ownershipHydrationData('requested-shared'));
    sharedData = { ...sharedData, isLoading: true };
    const { result, rerender } = renderHook(() => useReportBuilderState('', share));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    sharedData = { ...sharedData, isLoading: false };
    rerender();

    expect(result.current.error?.message).toBe(OWNERSHIP_HYDRATION_ERRORS.source);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.reportState).toBeNull();
  });

  test('given an empty refresh after editing then immediately hides old state and rejects stale setters before recovery', () => {
    const renderedStates: ReturnType<typeof useReportBuilderState>[] = [];
    const { result, rerender } = renderHook(() => {
      const state = useReportBuilderState('first-association');
      renderedStates.push(state);
      return state;
    });
    const staleSetter = result.current.setReportState;
    act(() => staleSetter((state) => changeReportYear(state!, '2023')));
    const rendersBeforeRefresh = renderedStates.length;

    ownedData = { ...ownedData, simulations: [] };
    rerender();

    expect(renderedStates[rendersBeforeRefresh].reportState).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error?.message).toBe(OWNERSHIP_HYDRATION_ERRORS.empty);
    const staleUpdate = vi.fn((state) => ({ ...state!, year: '2022' }));
    act(() => staleSetter(staleUpdate));
    expect(staleUpdate).not.toHaveBeenCalled();

    ownedData = ownershipHydrationData('first');
    rerender();
    expect(result.current.error).toBeNull();
    expect(result.current.reportState?.year).toBe('2026');
    expect(result.current.originalState?.year).toBe('2026');
    expect(result.current.originalState?.simulations[0].population.household).toBeInstanceOf(
      Household
    );
    act(() => staleSetter(staleUpdate));
    expect(staleUpdate).not.toHaveBeenCalled();
    expect(result.current.reportState?.year).toBe('2026');
  });

  test('given a terminal fetch error after editing then preserves the error and removes the editable draft', () => {
    const { result, rerender } = renderHook(() => useReportBuilderState('first-association'));
    act(() => result.current.setReportState((state) => changeReportYear(state!, '2023')));
    const error = new Error(OWNERSHIP_HYDRATION_ERRORS.fetch);
    ownedData = { ...ownedData, error };

    rerender();

    expect(result.current.error).toBe(error);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.reportState).toBeNull();
    expect(result.current.originalState).toBeNull();
  });

  test('given a source switch still loading then rejects stale setters and reopening starts from saved inputs', () => {
    const { result, rerender } = renderHook(({ id }) => useReportBuilderState(id), {
      initialProps: { id: 'first-association' },
    });
    const staleSetter = result.current.setReportState;
    act(() => staleSetter((state) => changeReportYear(state!, '2023')));
    ownedData = { ...ownedData, isLoading: true };
    rerender({ id: 'second-association' });
    const staleUpdate = vi.fn((state) => ({ ...state!, year: '2022' }));

    act(() => staleSetter(staleUpdate));

    expect(staleUpdate).not.toHaveBeenCalled();
    expect(result.current.reportState).toBeNull();
    expect(result.current.error).toBeNull();
    ownedData = ownershipHydrationData('first');
    rerender({ id: 'first-association' });
    expect(result.current.reportState?.year).toBe('2026');
    act(() => staleSetter(staleUpdate));
    expect(staleUpdate).not.toHaveBeenCalled();
    expect(result.current.reportState?.year).toBe('2026');
  });
});
