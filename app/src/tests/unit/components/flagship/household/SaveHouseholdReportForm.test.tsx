import { configureStore } from '@reduxjs/toolkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SaveHouseholdReportForm from '@/components/flagship/household/SaveHouseholdReportForm';
import metadataReducer from '@/reducers/metadataReducer';
import { TEST_CURRENT_LAW_ID } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { V2_REFORM_POLICY_ID } from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import {
  householdReportItem,
  SAVED_HOUSEHOLD_REPORT_NAME,
  V2_HOUSEHOLD_REPORT_IDS,
} from '@/tests/fixtures/api/v2HouseholdReportMocks';
import { createTestApiContext } from '@/tests/fixtures/api/v2UserMocks';
import { testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import { REFORM_POLICY_ID } from '@/tests/fixtures/libs/flagship/householdRunMocks';
import { STORED_V2_HOUSEHOLD_ID } from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

const mockSubmitReport = vi.fn();
const mockSaveReport = vi.fn();
const mockSavedWork = vi.fn();
vi.mock('@/api/v2HouseholdReports', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/v2HouseholdReports')>()),
  submitV2HouseholdReport: (...args: unknown[]) => mockSubmitReport(...args),
  saveV2HouseholdReport: (...args: unknown[]) => mockSaveReport(...args),
}));
vi.mock('@/hooks/useFlagshipStores', () => ({
  useV3SavedWork: () => mockSavedWork(),
}));

const { context: ACCOUNT } = createTestApiContext('us');

function renderForm(reformPolicyId = V2_REFORM_POLICY_ID) {
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
  const formFor = (reform: string) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SaveHouseholdReportForm
          countryId="us"
          householdId={STORED_V2_HOUSEHOLD_ID}
          baselinePolicyId={String(TEST_CURRENT_LAW_ID)}
          reformPolicyId={reform}
        />
      </QueryClientProvider>
    </Provider>
  );
  const rendered = render(formFor(reformPolicyId));
  return { showReform: (reform: string) => rendered.rerender(formFor(reform)) };
}

async function saveAs(name: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Report name'), name);
  await user.click(screen.getByRole('button', { name: 'Save report' }));
}

describe('SaveHouseholdReportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSavedWork.mockReturnValue({ account: ACCOUNT, scope: 'account:test' });
    mockSubmitReport.mockResolvedValue(householdReportItem('pending'));
    mockSaveReport.mockResolvedValue(V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT);
  });

  test('given a name then the household report is created, current law as no policy, and saved in the account under it', async () => {
    // When
    renderForm();
    await saveAs(SAVED_HOUSEHOLD_REPORT_NAME);

    // Then
    expect(mockSubmitReport).toHaveBeenCalledWith({
      countryId: 'us',
      householdId: STORED_V2_HOUSEHOLD_ID,
      baselinePolicyId: null,
      reformPolicyId: V2_REFORM_POLICY_ID,
    });
    expect(mockSaveReport).toHaveBeenCalledWith(ACCOUNT, {
      countryId: 'us',
      reportId: V2_HOUSEHOLD_REPORT_IDS.REPORT,
      name: SAVED_HOUSEHOLD_REPORT_NAME,
    });
  });

  test('given a saved report then its link, the saved report ID, is offered to share', async () => {
    // When
    renderForm();
    await saveAs(SAVED_HOUSEHOLD_REPORT_NAME);

    // Then
    expect(await screen.findByRole('link', { name: /Open the saved report/ })).toHaveAttribute(
      'href',
      `/us/report/${V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT}`
    );
  });

  test('given the Public API refuses the report then it says why, and nothing is saved', async () => {
    // Given
    mockSubmitReport.mockRejectedValue(new Error('The simulation service is unavailable.'));

    // When
    renderForm();
    await saveAs(SAVED_HOUSEHOLD_REPORT_NAME);

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The simulation service is unavailable.'
    );
    expect(mockSaveReport).not.toHaveBeenCalled();
  });

  test('given only the save in the account failed then trying again saves the same report, and creates no other', async () => {
    // Given
    const user = userEvent.setup();
    mockSaveReport
      .mockRejectedValueOnce(new Error('Saved work is temporarily unavailable.'))
      .mockResolvedValueOnce(V2_HOUSEHOLD_REPORT_IDS.SAVED_REPORT);
    renderForm();
    await saveAs(SAVED_HOUSEHOLD_REPORT_NAME);
    await screen.findByRole('alert');

    // When
    await user.click(screen.getByRole('button', { name: 'Save report' }));

    // Then
    expect(await screen.findByRole('link', { name: /Open the saved report/ })).toBeInTheDocument();
    expect(mockSubmitReport).toHaveBeenCalledTimes(1);
    expect(mockSaveReport.mock.calls.map(([, saved]) => saved.reportId)).toEqual([
      V2_HOUSEHOLD_REPORT_IDS.REPORT,
      V2_HOUSEHOLD_REPORT_IDS.REPORT,
    ]);
  });

  test('given the policies changed after only the save failed then a report of the new policies is created and saved', async () => {
    // Given
    const user = userEvent.setup();
    const otherReformPolicyId = '5e5e5e5e-5e5e-4e5e-8e5e-5e5e5e5e5e5e';
    const otherReportId = 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd';
    mockSubmitReport
      .mockResolvedValueOnce(householdReportItem('pending'))
      .mockResolvedValueOnce({ ...householdReportItem('pending'), id: otherReportId });
    mockSaveReport.mockRejectedValueOnce(new Error('Saved work is temporarily unavailable.'));
    const { showReform } = renderForm();
    await saveAs(SAVED_HOUSEHOLD_REPORT_NAME);
    await screen.findByRole('alert');

    // When
    showReform(otherReformPolicyId);
    await user.click(screen.getByRole('button', { name: 'Save report' }));

    // Then
    await screen.findByRole('link', { name: /Open the saved report/ });
    expect(mockSubmitReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ reformPolicyId: otherReformPolicyId })
    );
    expect(mockSaveReport).toHaveBeenLastCalledWith(
      ACCOUNT,
      expect.objectContaining({ reportId: otherReportId })
    );
  });

  test('given a reform known only by its v1 policy number then it says why, and nothing is sent', async () => {
    // When
    renderForm(REFORM_POLICY_ID);
    await saveAs(SAVED_HOUSEHOLD_REPORT_NAME);

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      `Policy ${REFORM_POLICY_ID} is a v1 policy, which the v2 household calculations cannot use.`
    );
    expect(mockSubmitReport).not.toHaveBeenCalled();
  });

  test('given no saved work here then no report can be saved', () => {
    // Given
    mockSavedWork.mockReturnValue({ account: null, scope: 'browser' });

    // When
    renderForm();

    // Then
    expect(screen.getByText('Saved reports are not available here.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save report' })).not.toBeInTheDocument();
  });
});
