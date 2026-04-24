import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import ModifyReportPage from '@/pages/reportBuilder/ModifyReportPage';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';

const mockUseAppLocation = vi.fn();
const mockUseReportBuilderState = vi.fn();
const mockReportBuilderShell = vi.fn();

const baseReportState: ReportBuilderState = {
  id: 'sur-123',
  label: 'Test report',
  year: '2024',
  simulations: [],
};

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

vi.mock('@/contexts/NavigationContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/NavigationContext')>(
    '@/contexts/NavigationContext'
  );
  return {
    ...actual,
    useAppNavigate: () => ({
      push: vi.fn(),
    }),
  };
});

vi.mock('@/contexts/LocationContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/LocationContext')>(
    '@/contexts/LocationContext'
  );
  return {
    ...actual,
    useAppLocation: () => mockUseAppLocation(),
  };
});

vi.mock('@/pages/reportBuilder/hooks/useReportBuilderState', () => ({
  useReportBuilderState: (...args: unknown[]) => mockUseReportBuilderState(...args),
}));

vi.mock('@/pages/reportBuilder/hooks/useModifyReportSubmission', () => ({
  useModifyReportSubmission: () => ({
    handleSaveAsNew: vi.fn(),
    handleReplace: vi.fn(),
    isSavingNew: false,
    isReplacing: false,
  }),
}));

vi.mock('@/pages/reportBuilder/components', () => ({
  ReportBuilderShell: (props: unknown) => {
    mockReportBuilderShell(props);
    return <div data-testid="report-builder-shell" />;
  },
  SimulationBlockFull: () => <div data-testid="simulation-block-full" />,
}));

describe('ModifyReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppLocation.mockReturnValue({
      pathname: '/us/reports/create/sur-123',
      search: '',
    });
    mockUseReportBuilderState.mockReturnValue({
      reportState: baseReportState,
      setReportState: vi.fn(),
      originalState: baseReportState,
      isLoading: false,
      error: null,
    });
  });

  test('given owned report then edit action is available', () => {
    render(<ModifyReportPage userReportId="sur-123" />);

    const shellProps = mockReportBuilderShell.mock.calls[0]?.[0];
    expect(shellProps.actions).toHaveLength(1);
    expect(shellProps.actions[0].label).toBe('Edit report');
    expect(shellProps.isReadOnly).toBe(true);
    expect(shellProps.backPath).toBe('/us/report-output/sur-123');
    expect(shellProps.backLabel).toBe('Test report');
  });

  test('given share query then builder stays read-only and hides edit actions', () => {
    const shareData: ReportIngredientsInput = {
      userReport: {
        id: 'sur-shared-123',
        reportId: 'rpt-123',
        countryId: 'us',
        label: 'Shared report',
      },
      userSimulations: [],
      userPolicies: [],
      userHouseholds: [],
      userGeographies: [],
    };
    const encodedShare = btoa(JSON.stringify(shareData))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    mockUseAppLocation.mockReturnValue({
      pathname: '/us/reports/create/sur-shared-123',
      search: `?share=${encodedShare}`,
    });

    render(<ModifyReportPage userReportId="sur-shared-123" />);

    const shellProps = mockReportBuilderShell.mock.calls[0]?.[0];
    expect(shellProps.title).toBe('View report setup');
    expect(shellProps.actions).toEqual([]);
    expect(shellProps.isReadOnly).toBe(true);
    expect(shellProps.backPath).toBe(`/us/report-output/sur-shared-123?share=${encodedShare}`);
    expect(shellProps.backLabel).toBe('Test report');
    expect(mockUseReportBuilderState).toHaveBeenCalledWith('sur-shared-123', shareData);
    expect(screen.getByTestId('report-builder-shell')).toBeInTheDocument();
  });

  test('given report with no label then breadcrumb falls back to report id', () => {
    mockUseReportBuilderState.mockReturnValue({
      reportState: { ...baseReportState, label: null },
      setReportState: vi.fn(),
      originalState: { ...baseReportState, label: null },
      isLoading: false,
      error: null,
    });

    render(<ModifyReportPage userReportId="sur-123" />);

    const shellProps = mockReportBuilderShell.mock.calls[0]?.[0];
    expect(shellProps.backLabel).toBe('sur-123');
  });
});
