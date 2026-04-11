import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ModifyReportPage from '@/pages/reportBuilder/ModifyReportPage';
import { useReportBuilderState } from '@/pages/reportBuilder/hooks/useReportBuilderState';
import { extractShareDataFromUrl } from '@/utils/shareUtils';

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockSetReportState = vi.fn();
const mockHandleSaveAsNew = vi.fn();
const mockHandleReplace = vi.fn();

const MOCK_SHARE_DATA = {
  userReport: {
    id: 'sur-shared-123',
    reportId: 'report-123',
    countryId: 'us' as const,
    label: 'Shared report',
    isCreated: true,
  },
  userSimulations: [],
  userPolicies: [],
  userHouseholds: [],
  userGeographies: [],
};

const MOCK_REPORT_STATE = {
  id: 'sur-shared-123',
  label: 'Shared report',
  year: '2026',
  simulations: [],
};

let mockLocation = {
  pathname: '/us/reports/create/sur-shared-123',
  search: '',
};

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

vi.mock('@/contexts/LocationContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/LocationContext')>(
    '@/contexts/LocationContext'
  );
  return {
    ...actual,
    useAppLocation: () => mockLocation,
  };
});

vi.mock('@/contexts/NavigationContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/NavigationContext')>(
    '@/contexts/NavigationContext'
  );
  return {
    ...actual,
    useAppNavigate: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    }),
  };
});

vi.mock('@/utils/shareUtils', async () => {
  const actual = await vi.importActual<typeof import('@/utils/shareUtils')>('@/utils/shareUtils');
  return {
    ...actual,
    extractShareDataFromUrl: vi.fn(() => null),
  };
});

vi.mock('@/pages/reportBuilder/hooks/useReportBuilderState', () => ({
  useReportBuilderState: vi.fn(() => ({
    reportState: MOCK_REPORT_STATE,
    setReportState: mockSetReportState,
    originalState: MOCK_REPORT_STATE,
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/pages/reportBuilder/hooks/useModifyReportSubmission', () => ({
  useModifyReportSubmission: vi.fn(() => ({
    handleSaveAsNew: mockHandleSaveAsNew,
    handleReplace: mockHandleReplace,
    isSavingNew: false,
    isReplacing: false,
  })),
}));

vi.mock('@/pages/reportBuilder/components', () => ({
  ReportBuilderShell: ({
    title,
    actions,
    isReadOnly,
    backPath,
    backLabel,
  }: {
    title: string;
    actions: Array<{ key: string; label: string }>;
    isReadOnly?: boolean;
    backPath?: string;
    backLabel?: string;
  }) => (
    <div>
      <h1>{title}</h1>
      <div>{isReadOnly ? 'Read only' : 'Editable'}</div>
      <div>{backPath ? `Back target: ${backLabel} -> ${backPath}` : 'No back target'}</div>
      {actions.map((action) => (
        <button key={action.key} type="button">
          {action.label}
        </button>
      ))}
    </div>
  ),
  SimulationBlockFull: () => <div>Simulation block</div>,
}));

describe('ModifyReportPage', () => {
  beforeEach(() => {
    mockLocation = {
      pathname: '/us/reports/create/sur-shared-123',
      search: '',
    };
    mockPush.mockReset();
    mockReplace.mockReset();
    mockBack.mockReset();
    mockSetReportState.mockReset();
    mockHandleSaveAsNew.mockReset();
    mockHandleReplace.mockReset();
    vi.mocked(useReportBuilderState).mockClear();
    vi.mocked(extractShareDataFromUrl).mockReset();
  });

  test('given shared report source then loads share data and renders read-only setup', () => {
    // Given
    mockLocation.search = '?share=encoded-data';
    vi.mocked(extractShareDataFromUrl).mockReturnValue(MOCK_SHARE_DATA);

    // When
    render(<ModifyReportPage userReportId="sur-shared-123" />);

    // Then
    expect(vi.mocked(useReportBuilderState)).toHaveBeenCalledWith('sur-shared-123', {
      shareData: MOCK_SHARE_DATA,
    });
    expect(screen.getByRole('heading', { name: /view report setup/i })).toBeInTheDocument();
    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(
      screen.getByText('Back target: report output -> /us/report-output/sur-shared-123?share=encoded-data')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit report/i })).not.toBeInTheDocument();
  });

  test('given owned report source then renders the edit action', () => {
    // Given
    vi.mocked(extractShareDataFromUrl).mockReturnValue(null);

    // When
    render(<ModifyReportPage userReportId="sur-owned-123" />);

    // Then
    expect(vi.mocked(useReportBuilderState)).toHaveBeenCalledWith('sur-owned-123', {
      shareData: null,
    });
    expect(
      screen.getByText('Back target: report output -> /us/report-output/sur-owned-123')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit report/i })).toBeInTheDocument();
  });

  test('given cached report state while query is still loading then renders setup without blocking', () => {
    // Given
    vi.mocked(extractShareDataFromUrl).mockReturnValue(null);
    vi.mocked(useReportBuilderState).mockReturnValueOnce({
      reportState: MOCK_REPORT_STATE,
      setReportState: mockSetReportState,
      originalState: MOCK_REPORT_STATE,
      isLoading: true,
      error: null,
    });

    // When
    render(<ModifyReportPage userReportId="sur-owned-123" />);

    // Then
    expect(screen.getByRole('heading', { name: /view report setup/i })).toBeInTheDocument();
    expect(screen.queryByText(/loading report/i)).not.toBeInTheDocument();
  });
});
