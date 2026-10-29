import { configureStore } from '@reduxjs/toolkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdReportPage from '@/pages/flagship/HouseholdReport.page';
import metadataReducer from '@/reducers/metadataReducer';
import { TEST_CURRENT_LAW_ID } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { V2_REFORM_POLICY_ID } from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { createTestApiContext } from '@/tests/fixtures/api/v2UserMocks';
import { testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import { BASELINE_RESULT, REFORM_RESULT } from '@/tests/fixtures/libs/flagship/householdRunMocks';
import {
  STORED_V2_HOUSEHOLD_ID,
  US_SINGLE_PARENT,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';
import { READY_TO_RUN } from '@/tests/fixtures/pages/flagship/householdReportPageMocks';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const mockRunV2Household = vi.fn();
const mockSavedWork = vi.fn();
vi.mock('@/libs/flagship/v2HouseholdRun', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v2HouseholdRun')>()),
  runV2FlagshipHousehold: (...args: unknown[]) => mockRunV2Household(...args),
}));
vi.mock('@/hooks/useFlagshipStores', () => ({
  useV3SavedWork: () => mockSavedWork(),
}));
// The report's policies, tested on their own: none to show here.
vi.mock('@/hooks/useV3Policies', () => ({
  useV3Policies: () => ({ policies: [], failedPolicyIds: [], isLoading: false, retry: vi.fn() }),
}));
vi.mock('@/hooks/useV3Variables', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useV3Variables')>()),
  useV3Variables: () => ({ status: 'ready', message: null, retry: vi.fn() }),
}));
vi.mock('@/components/household/HouseholdBuilderForm', () => ({
  default: () => <div aria-label="Household builder" />,
}));
vi.mock('@/components/flagship/report/household/HouseholdBreakdowns', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/flagship/report/household/HouseholdBreakdowns')
  >()),
  default: () => <div aria-label="Breakdown" />,
}));
vi.mock('@/utils/HouseholdValidation', () => ({
  HouseholdValidation: { isReadyForSimulation: () => READY_TO_RUN },
}));

/** The run the v2 routes answer with: the stored household under each policy. */
const V2_RUN = {
  householdId: STORED_V2_HOUSEHOLD_ID,
  baseline: BASELINE_RESULT,
  reform: REFORM_RESULT,
  netIncome: { baseline: 71000, reform: 72000, change: 1000 },
  components: [],
  programs: [],
  provenance: { baseline: { policyengineBundle: null }, reform: { policyengineBundle: null } },
};

function renderReport() {
  const store = configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: {
      metadata: {
        ...metadataReducer(undefined, { type: 'test/init' }),
        currentLawId: TEST_CURRENT_LAW_ID,
      },
    },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={testQueryClient()}>
        <HouseholdReportPage
          countryId="us"
          year={V2_CODEC_YEAR}
          household={US_SINGLE_PARENT}
          reformPolicyId={V2_REFORM_POLICY_ID}
          reformLabel="EITC expansion"
        />
      </QueryClientProvider>
    </Provider>
  );
}

describe('HouseholdReportPage with v3 on the v2 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunV2Household.mockResolvedValue(V2_RUN);
    mockSavedWork.mockReturnValue({
      account: createTestApiContext('us').context,
      scope: 'account:test',
    });
  });

  test('given a calculated household then the report can be saved, for the household the run stored', async () => {
    // Given
    const user = userEvent.setup();
    renderReport();

    // When
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    // Then
    const saving = await screen.findByRole('region', { name: 'Save this report' });
    expect(saving).toContainElement(screen.getByRole('button', { name: 'Save report' }));
    expect(mockRunV2Household).toHaveBeenCalledWith(
      expect.objectContaining({ baselinePolicyId: null, reformPolicyId: V2_REFORM_POLICY_ID }),
      expect.anything()
    );
  });

  test('given no calculation yet then there is no report to save', () => {
    // When
    renderReport();

    // Then
    expect(screen.queryByRole('region', { name: 'Save this report' })).not.toBeInTheDocument();
  });
});
