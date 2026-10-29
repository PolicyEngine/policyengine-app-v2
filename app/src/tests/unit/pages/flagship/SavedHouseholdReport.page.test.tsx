import { configureStore } from '@reduxjs/toolkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, userEvent, within } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SavedHouseholdReportPage from '@/pages/flagship/SavedHouseholdReport.page';
import metadataReducer from '@/reducers/metadataReducer';
import { TEST_CURRENT_LAW_ID } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { V2_REFORM_POLICY_ID } from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import {
  householdReportItem,
  SAVED_HOUSEHOLD_REPORT_NAME,
  V2_HOUSEHOLD_REPORT_IDS,
} from '@/tests/fixtures/api/v2HouseholdReportMocks';
import { testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import {
  STORED_V2_HOUSEHOLD_ID,
  storedV2Household,
  US_SINGLE_PARENT_V2_BODY,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

/**
 * A saved household report, opened by its link: the saved report's ID.
 * No route renders it before v3 moves to the Public API's v2 routes.
 */

const mockReadShared = vi.fn();
const mockWaitForReport = vi.fn();
const mockFetchStoredHousehold = vi.fn();
vi.mock('@/api/v2HouseholdReports', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/v2HouseholdReports')>()),
  readSharedHouseholdReport: (...args: unknown[]) => mockReadShared(...args),
  waitForV2HouseholdReport: (...args: unknown[]) => mockWaitForReport(...args),
}));
vi.mock('@/api/v2HouseholdCalculations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/v2HouseholdCalculations')>()),
  fetchV2Household: (...args: unknown[]) => mockFetchStoredHousehold(...args),
}));
vi.mock('@/hooks/useV3Variables', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useV3Variables')>()),
  useV3Variables: () => ({ status: 'ready', message: null, retry: vi.fn() }),
}));
// The breakdowns, tested on their own: a stand-in shows what they are given.
vi.mock('@/components/flagship/report/household/HouseholdBreakdowns', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/flagship/report/household/HouseholdBreakdowns')
  >()),
  default: ({ source }: any) => (
    <div aria-label="Breakdown">
      {[source.householdId, source.year, source.baselinePolicyId, source.reformPolicyId].join(
        ' · '
      )}
    </div>
  ),
}));

function renderSavedReport() {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: {
      metadata: {
        ...metadataReducer(undefined, { type: 'test/init' }),
        currentLawId: TEST_CURRENT_LAW_ID,
      },
    },
  });
  const queryClient = testQueryClient();
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SavedHouseholdReportPage
          countryId="us"
          savedReportId={V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT}
        />
      </QueryClientProvider>
    </Provider>
  );
  return { queryClient };
}

describe('SavedHouseholdReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadShared.mockResolvedValue({
      reportId: V2_HOUSEHOLD_REPORT_IDS.REPORT,
      name: SAVED_HOUSEHOLD_REPORT_NAME,
    });
    mockWaitForReport.mockResolvedValue(householdReportItem());
    mockFetchStoredHousehold.mockResolvedValue(
      storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data)
    );
  });

  test("given a saved household report's link then its name and the change in net income show", async () => {
    // When
    renderSavedReport();

    // Then
    expect(
      await screen.findByRole('heading', { name: SAVED_HOUSEHOLD_REPORT_NAME })
    ).toBeInTheDocument();
    const result = await screen.findByRole('region', { name: 'Household impact' });
    expect(
      within(result).getByRole('group', { name: 'Change in annual net income' })
    ).toHaveTextContent('+$1,500');
    expect(mockReadShared).toHaveBeenCalledWith('us', V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT);
    expect(mockWaitForReport).toHaveBeenCalledWith(
      'us',
      V2_HOUSEHOLD_REPORT_IDS.REPORT,
      expect.anything()
    );
    expect(mockFetchStoredHousehold).toHaveBeenCalledWith('us', STORED_V2_HOUSEHOLD_ID);
  });

  test('given the report then its breakdowns read the stored household, its year and its v2 policies', async () => {
    // Given
    const user = userEvent.setup();
    renderSavedReport();
    const result = await screen.findByRole('region', { name: 'Household impact' });

    // When
    await user.click(within(result).getByRole('tab', { name: 'Marginal tax rates' }));

    // Then
    expect(within(result).getByLabelText('Breakdown')).toHaveTextContent(
      [STORED_V2_HOUSEHOLD_ID, '2026', String(TEST_CURRENT_LAW_ID), V2_REFORM_POLICY_ID].join(' · ')
    );
  });

  test('given a baseline-only report then its net income under one policy shows', async () => {
    // Given
    mockWaitForReport.mockResolvedValue(householdReportItem('succeeded', { reform: false }));

    // When
    renderSavedReport();

    // Then
    expect(await screen.findByRole('region', { name: 'Household net income' })).toHaveTextContent(
      '$12,000'
    );
  });

  test('given the report still calculating then its progress shows', async () => {
    // Given
    mockWaitForReport.mockReturnValue(new Promise(() => {}));

    // When
    renderSavedReport();

    // Then
    expect(await screen.findByText('Calculating this household report')).toBeInTheDocument();
  });

  test('given a link no saved report has then it says the report cannot be found', async () => {
    // Given
    mockReadShared.mockResolvedValue(null);

    // When
    renderSavedReport();

    // Then
    expect(await screen.findByText('This report could not be found')).toBeInTheDocument();
    expect(mockWaitForReport).not.toHaveBeenCalled();
  });

  test('given a report whose calculation failed then it says why, and Try again reads it again', async () => {
    // Given
    const user = userEvent.setup();
    mockWaitForReport.mockRejectedValueOnce(new Error('ctc_value cannot be negative'));

    // When
    renderSavedReport();
    expect(await screen.findByText('ctc_value cannot be negative')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByRole('region', { name: 'Household impact' })).toBeInTheDocument();
    expect(mockWaitForReport).toHaveBeenCalledTimes(2);
  });

  test('given a report on screen whose background re-read fails then the report stays on screen', async () => {
    // Given
    const { queryClient } = renderSavedReport();
    await screen.findByRole('region', { name: 'Household impact' });
    mockReadShared.mockRejectedValue(new Error('Network error: Failed to fetch'));
    mockWaitForReport.mockRejectedValue(new Error('Network error: Failed to fetch'));
    mockFetchStoredHousehold.mockRejectedValue(new Error('Network error: Failed to fetch'));

    // When
    await act(async () => {
      await queryClient.refetchQueries();
      // The query library tells the page of the failures on its next tick.
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    // Then
    expect(screen.getByRole('region', { name: 'Household impact' })).toBeInTheDocument();
    expect(screen.queryByText('This household report could not be opened')).not.toBeInTheDocument();
  });
});
