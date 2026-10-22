import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchLocalAreaBreakdown } from '@/api/societyWideCalculation';
import { LocalAuthoritySubPage } from '@/pages/report-output/LocalAuthoritySubPage';
import { NATIONAL_OUTPUT_WITHOUT_AREAS } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { COMPUTE_BUTTON_LABEL } from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import { COMPLETE_RESPONSE } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import {
  MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD,
  MOCK_UK_REPORT_OUTPUT_WITH_LA,
} from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import {
  V2_UK_LOCAL_AREA_REQUEST_PROPS,
  withNullAreaImpacts,
} from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';

vi.mock('@/api/societyWideCalculation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/societyWideCalculation')>()),
  fetchLocalAreaBreakdown: vi.fn(),
}));

const mockFetchLocalAreaBreakdown = vi.mocked(fetchLocalAreaBreakdown);
const BREAKDOWN_LOCAL_AUTHORITY_NAME = 'Hartlepool';

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, 'uk');
}

describe('LocalAuthoritySubPage', () => {
  test('given UK report with local authority data then renders tabs', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(screen.getByText('Absolute change')).toBeInTheDocument();
    expect(screen.getByText('Relative change')).toBeInTheDocument();
  });

  test('given UK report with local authority data then renders absolute change by default', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(
      screen.getByText('Absolute household income change by local authority')
    ).toBeInTheDocument();
  });

  test('given report without local_authority_impact field then shows not available message', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD;

    // When
    render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(
      screen.getByText('Local authority analysis not available for this region')
    ).toBeInTheDocument();
  });

  test('given UK report then component renders without error', () => {
    // Given
    const output = MOCK_UK_REPORT_OUTPUT_WITH_LA;

    // When
    const { container } = render(<LocalAuthoritySubPage output={output} />);

    // Then
    expect(container).toBeInTheDocument();
  });

  describe('given a report whose result has no local authority data', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test.each([
      ['missing', NATIONAL_OUTPUT_WITHOUT_AREAS],
      ['null', withNullAreaImpacts(NATIONAL_OUTPUT_WITHOUT_AREAS)],
    ])(
      'given %s local authority data then it offers to compute instead of saying it is not available',
      (_label, output) => {
        // When
        renderWithQueryClient(
          <LocalAuthoritySubPage output={output} {...V2_UK_LOCAL_AREA_REQUEST_PROPS} />
        );

        // Then
        expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
        expect(
          screen.queryByText('Local authority analysis not available for this region')
        ).not.toBeInTheDocument();
        expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
      }
    );

    test('given the areas computed then they reach the local authority charts', async () => {
      // Given
      const user = userEvent.setup();
      mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
      const { container } = renderWithQueryClient(
        <LocalAuthoritySubPage
          output={NATIONAL_OUTPUT_WITHOUT_AREAS}
          {...V2_UK_LOCAL_AREA_REQUEST_PROPS}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

      // Then
      expect(
        await screen.findByText('Absolute household income change by local authority')
      ).toBeInTheDocument();
      // The map's one hexagon is the computed area: hovering it names it.
      const hexagons = container.querySelectorAll('svg polygon');
      expect(hexagons).toHaveLength(1);
      await user.hover(hexagons[0]);
      expect(
        screen.getByText(new RegExp(`^${BREAKDOWN_LOCAL_AUTHORITY_NAME}:`))
      ).toBeInTheDocument();
    });
  });
});
