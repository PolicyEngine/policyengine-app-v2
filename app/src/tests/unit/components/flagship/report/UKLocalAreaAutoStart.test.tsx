import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchLocalAreaBreakdown } from '@/api/societyWideCalculation';
import UKLocalAreaAutoStart from '@/components/flagship/report/UKLocalAreaAutoStart';
import {
  NATIONAL_OUTPUT_WITHOUT_AREAS,
  STORED_OUTPUT_WITH_AREAS,
  UK_SECTION_PROPS,
  UNVERSIONED_OUTPUT_WITHOUT_AREAS,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { QUEUED_RESPONSE } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';

vi.mock('@/api/societyWideCalculation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/societyWideCalculation')>()),
  fetchLocalAreaBreakdown: vi.fn(),
}));

const mockFetchLocalAreaBreakdown = vi.mocked(fetchLocalAreaBreakdown);

function renderAutoStart(props: Partial<Parameters<typeof UKLocalAreaAutoStart>[0]>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UKLocalAreaAutoStart output={null} {...UK_SECTION_PROPS} {...props} />
    </QueryClientProvider>,
    'uk'
  );
}

/** Lets effects and any request they send settle. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

describe('UKLocalAreaAutoStart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchLocalAreaBreakdown.mockResolvedValue(QUEUED_RESPONSE);
  });

  test('given the national run calculating then the breakdown starts alongside it', async () => {
    // When
    renderAutoStart({ resultsRunning: true });

    // Then
    await waitFor(() => expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(1));
    expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledWith(
      'uk',
      UK_SECTION_PROPS.reformPolicyId,
      UK_SECTION_PROPS.baselinePolicyId,
      { region: UK_SECTION_PROPS.region, time_period: UK_SECTION_PROPS.year }
    );
  });

  test('given no results and no run calculating then nothing starts', async () => {
    // When
    renderAutoStart({});
    await settle();

    // Then
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });

  test('given results without area impacts then the breakdown starts', async () => {
    // When
    renderAutoStart({ output: NATIONAL_OUTPUT_WITHOUT_AREAS });

    // Then
    await waitFor(() => expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(1));
  });

  test.each([
    ['both levels', STORED_OUTPUT_WITH_AREAS],
    ['no release version', UNVERSIONED_OUTPUT_WITHOUT_AREAS],
  ])('given saved results with %s then nothing starts', async (_case, output) => {
    // When
    renderAutoStart({ output });
    await settle();

    // Then
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });
});
