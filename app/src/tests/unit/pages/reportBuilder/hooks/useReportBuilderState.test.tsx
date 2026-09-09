import { act, renderHook } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import { Household } from '@/models/Household';
import { useReportBuilderState } from '@/pages/reportBuilder/hooks/useReportBuilderState';
import { changeReportYear } from '@/pages/reportBuilder/utils/changeReportYear';
import { ownershipHydrationData } from '@/tests/fixtures/spm/reportBuilderOwnershipMocks';

let countryId: 'us' | 'uk' = 'us';
let ownedData = ownershipHydrationData('first');
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
    const { result, rerender } = renderHook(({ id }) => useReportBuilderState(id), {
      initialProps: { id: ownedData.userReport.id },
    });
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
    ownedData = { ...ownedData, isLoading: true };
    rerender({ id: 'second-association' });
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
});
