import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchLocalAreaBreakdown } from '@/api/societyWideCalculation';
import UKLocalAreaSection from '@/components/flagship/report/UKLocalAreaSection';
import {
  BREAKDOWN_CONSTITUENCY_NAME,
  BREAKDOWN_LOCAL_AUTHORITY_NAME,
  BREAKDOWN_RELEASE_OUTPUT_WITH_CONSTITUENCIES_ONLY,
  NATIONAL_OUTPUT_WITHOUT_AREAS,
  OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES,
  STORED_CONSTITUENCY_DETAILS,
  STORED_OUTPUT_WITH_AREAS,
  UK_SECTION_PROPS,
  UNVERSIONED_OUTPUT_WITHOUT_AREAS,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import {
  COMPUTE_BUTTON_LABEL,
  COMPUTING_MESSAGE,
  ERROR_MESSAGE,
} from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import {
  HEX_MAP_TAB,
  MAP_LEGEND_NAME,
  mockUKBoundaryFetch,
} from '@/tests/fixtures/components/visualization/choropleth/ukAreaChoroplethMapMocks';
import {
  COMPLETE_RESPONSE,
  COMPLETE_RESPONSE_WITH_UNLISTED_LOCAL_AUTHORITY,
  FAILED_RESPONSE,
  QUEUED_RESPONSE,
} from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';

vi.mock('@/api/societyWideCalculation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/societyWideCalculation')>()),
  fetchLocalAreaBreakdown: vi.fn(),
}));

vi.mock('@/hooks/useRegions', async () => {
  const { UK_METADATA_REGIONS } =
    await import('@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks');
  return { useRegions: () => ({ data: UK_METADATA_REGIONS }) };
});

const mockFetchLocalAreaBreakdown = vi.mocked(fetchLocalAreaBreakdown);

function renderSection(output = NATIONAL_OUTPUT_WITHOUT_AREAS, props = UK_SECTION_PROPS) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UKLocalAreaSection output={output} {...props} />
    </QueryClientProvider>,
    'uk'
  );
}

describe('UKLocalAreaSection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockUKBoundaryFetch());
    vi.clearAllMocks();
  });

  test('given a result without area impacts then it offers to compute them and sends nothing', () => {
    // When
    renderSection();

    // Then
    expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });

  test('given compute clicked then it sends one breakdown request for the report region and year', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(QUEUED_RESPONSE);
    renderSection();

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    await waitFor(() => expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(1));
    expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledWith(
      'uk',
      UK_SECTION_PROPS.reformPolicyId,
      UK_SECTION_PROPS.baselinePolicyId,
      { region: UK_SECTION_PROPS.region, time_period: UK_SECTION_PROPS.year }
    );
  });

  test('given the breakdown computing then it shows its progress', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(QUEUED_RESPONSE);
    renderSection();

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    expect(await screen.findByText(COMPUTING_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('given the breakdown complete then the maps show its areas', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    const { container } = renderSection();

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    expect(
      await screen.findByText('Absolute household income change by constituency')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: HEX_MAP_TAB }));
    expect(
      container.querySelector(`[data-area-id="${BREAKDOWN_CONSTITUENCY_NAME}"]`)
    ).not.toBeNull();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
  });

  test('given the breakdown failed then it offers retry, which sends the request again', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown
      .mockResolvedValueOnce(FAILED_RESPONSE)
      .mockResolvedValueOnce(COMPLETE_RESPONSE);
    renderSection();
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));
    expect(await screen.findByText(ERROR_MESSAGE)).toBeInTheDocument();

    // When
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    // Then
    await waitFor(() => expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(2));
  });

  test('given a saved result with area impacts then it shows the maps with no button', async () => {
    // When
    const user = userEvent.setup();
    renderSection(STORED_OUTPUT_WITH_AREAS);
    await user.click(screen.getByRole('tab', { name: HEX_MAP_TAB }));

    // Then
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: STORED_CONSTITUENCY_DETAILS })).toBeInTheDocument();
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });

  test('given a UK-wide breakdown complete then the map says how many constituencies were not reported', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    renderSection();

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    expect(
      await screen.findByText(/^2 of 3 constituencies are not reported\./)
    ).toBeInTheDocument();
  });

  test('given a UK-wide breakdown complete then the local authority map says how many local authorities were not reported', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    renderSection();
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));
    expect(
      await screen.findByText(/^2 of 3 constituencies are not reported\./)
    ).toBeInTheDocument();

    // When
    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    // Then
    expect(screen.getByText(/^2 of 3 local authorities are not reported\./)).toBeInTheDocument();
  });

  test('given a breakdown that publishes a local authority the region list does not name then that map has no count and the constituency map keeps its own', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE_WITH_UNLISTED_LOCAL_AUTHORITY);
    renderSection();
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));
    expect(
      await screen.findByText(/^2 of 3 constituencies are not reported\./)
    ).toBeInTheDocument();

    // When
    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    // Then
    expect(
      screen.getByText(/^Local authorities whose estimates fail the survey data’s disclosure rules/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/local authorities are not reported\./)).not.toBeInTheDocument();
  });

  test('given saved area data then no disclosure note shows', async () => {
    // When
    renderSection(STORED_OUTPUT_WITH_AREAS);

    // Then
    expect(screen.queryByText(/not reported/)).not.toBeInTheDocument();

    // The geographic map has loaded its boundaries.
    expect(await screen.findByRole('img', { name: MAP_LEGEND_NAME })).toBeInTheDocument();
  });

  test('given a breakdown release result with constituencies only then the local authority map offers to compute, and the constituency map stays', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    const { container } = renderSection(BREAKDOWN_RELEASE_OUTPUT_WITH_CONSTITUENCIES_ONLY);
    await user.click(screen.getByRole('tab', { name: HEX_MAP_TAB }));
    expect(screen.getByRole('button', { name: STORED_CONSTITUENCY_DETAILS })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();

    // When
    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    await waitFor(() =>
      expect(
        container.querySelector(`[data-area-id="${BREAKDOWN_LOCAL_AUTHORITY_NAME}"]`)
      ).not.toBeNull()
    );
    await user.click(screen.getByRole('tab', { name: 'Constituencies' }));
    expect(screen.getByRole('button', { name: STORED_CONSTITUENCY_DETAILS })).toBeInTheDocument();
    expect(screen.queryByText(/constituencies are not reported/)).not.toBeInTheDocument();
  });

  test('given an older stored result with constituencies but no local authorities then it says there is no local authority data and offers no compute', async () => {
    // Given
    const user = userEvent.setup();
    renderSection(OLDER_OUTPUT_WITHOUT_LOCAL_AUTHORITIES);
    await user.click(screen.getByRole('tab', { name: HEX_MAP_TAB }));
    expect(screen.getByRole('button', { name: STORED_CONSTITUENCY_DETAILS })).toBeInTheDocument();

    // When
    await user.click(screen.getByRole('tab', { name: 'Local authorities' }));

    // Then
    expect(screen.getByText('No local authority data available')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });

  test('given a stored result with no version and no area data then it says there is no data and offers no compute', () => {
    // When
    renderSection(UNVERSIONED_OUTPUT_WITHOUT_AREAS);

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });
});
