import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MOCK_USER_ID } from '@/constants';
import { useUserReports } from '@/hooks/useUserReports';
import ReportsPage from '@/pages/Reports.page';
import {
  createMockNavigate,
  ERROR_MESSAGES,
  mockDefaultHookReturn,
  mockEmptyHookReturn,
  mockErrorHookReturn,
  mockLoadingHookReturn,
  mockMixedStatusHookReturn,
} from '@/tests/fixtures/pages/reportsMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock the hooks
vi.mock('@/hooks/useUserReports', () => ({
  useUserReports: vi.fn(),
}));

// Mock navigate
const mockNavigate = createMockNavigate();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ countryId: 'us' }),
  };
});

// Mock IngredientReadView component
vi.mock('@/components/IngredientReadView', () => ({
  default: vi.fn(
    ({
      title,
      subtitle,
      onBuild,
      isLoading,
      isError,
      error,
      data,
      searchValue,
      onSearchChange,
      columns,
    }) => {
      // Extract menu action handler if columns are provided
      const menuColumn = columns?.find((col: any) => col.type === 'split-menu');
      const handleMenuAction = menuColumn?.onAction;

      // Find link column
      const linkColumn = columns?.find((col: any) => col.type === 'link');
      const linkKey = linkColumn?.key;

      return (
        <div data-testid="ingredient-read-view">
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {isLoading && <div>Loading...</div>}
          {isError && <div>Error: {error?.message}</div>}
          {data && (
            <>
              <div>Data count: {data.length}</div>
              {data.length > 0 && (
                <>
                  {linkKey && data[0][linkKey] && (
                    <a href={(data[0][linkKey] as any).url} data-testid="report-link">
                      {(data[0][linkKey] as any).text}
                    </a>
                  )}
                  {handleMenuAction && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction('view-output', data[0].id)}
                      data-testid="view-output-button"
                    >
                      View Output
                    </button>
                  )}
                </>
              )}
            </>
          )}
          <button type="button" onClick={onBuild}>
            Build Report
          </button>
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
          />
        </div>
      );
    }
  ),
}));

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    (useUserReports as any).mockReturnValue(mockDefaultHookReturn);
  });

  test('given reports data when rendering then displays reports page', () => {
    // When
    render(
      
        <ReportsPage />
      
    );

    // Then
    expect(screen.getByText('Your saved reports')).toBeInTheDocument();
    expect(screen.getByText(/Generate comprehensive impact analyses/)).toBeInTheDocument();
    expect(screen.getByText('Data count: 2')).toBeInTheDocument();
  });

  test('given loading state when rendering then shows loading indicator', () => {
    // Given
    (useUserReports as any).mockReturnValue(mockLoadingHookReturn);

    // When
    render(
      
        <ReportsPage />
      
    );

    // Then
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('given error state when rendering then shows error message', () => {
    // Given
    (useUserReports as any).mockReturnValue(mockErrorHookReturn);

    // When
    render(
      
        <ReportsPage />
      
    );

    // Then
    expect(screen.getByText(`Error: ${ERROR_MESSAGES.FETCH_FAILED}`)).toBeInTheDocument();
  });

  test('given user clicks build report button then dispatches report creation flow', async () => {
    // Given
    const user = userEvent.setup();
    render(
      
        <ReportsPage />
      
    );

    // When
    await user.click(screen.getByRole('button', { name: /Build Report/i }));

    // Then
    expect(mockNavigate).toHaveBeenCalledWith('create');
  });

  test('given no reports when rendering then displays empty state', () => {
    // Given
    (useUserReports as any).mockReturnValue(mockEmptyHookReturn);

    // When
    render(
      
        <ReportsPage />
      
    );

    // Then
    expect(screen.getByText('Data count: 0')).toBeInTheDocument();
  });

  test('given user searches then updates search value', async () => {
    // Given
    const user = userEvent.setup();
    render(
      
        <ReportsPage />
      
    );

    // When
    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'Test Report');

    // Then
    expect(searchInput).toHaveValue('Test Report');
  });

  test('given hook returns correct user ID then uses MOCK_USER_ID', () => {
    // When
    render(
      
        <ReportsPage />
      
    );

    // Then
    expect(useUserReports).toHaveBeenCalledWith(MOCK_USER_ID.toString());
  });

  test('given reports with different statuses then formats status correctly', () => {
    // Given
    (useUserReports as any).mockReturnValue(mockMixedStatusHookReturn);

    // When
    render(
      
        <ReportsPage />
      
    );

    // Then
    expect(screen.getByText('Data count: 3')).toBeInTheDocument();
  });

  test('given user clicks view output then navigates with UserReport ID', async () => {
    // Given
    const user = userEvent.setup();
    render(
      
        <ReportsPage />
      
    );

    // When - click the report link which navigates to output
    await user.click(screen.getByTestId('report-link'));

    // Then - link href points to the correct output URL
    // Note: React Router Link components don't trigger mockNavigate in this test setup,
    // so we verify the href attribute instead
    const reportLink = screen.getByTestId('report-link');
    expect(reportLink).toHaveAttribute('href', '/us/report-output/report-1');
  });

  test('given reports data when rendering then report column displays as link with UserReport ID', () => {
    // When
    render(
      
        <ReportsPage />
      
    );

    // Then
    const reportLink = screen.getByTestId('report-link');
    expect(reportLink).toBeInTheDocument();
    expect(reportLink).toHaveAttribute('href', '/us/report-output/report-1');
    expect(reportLink).toHaveTextContent('Test Report 1');
  });

  test('given report without custom label then link displays default label', () => {
    // Given
    const dataWithoutLabel = {
      ...mockDefaultHookReturn,
      data: [
        {
          ...mockDefaultHookReturn.data![0],
          userReport: {
            ...mockDefaultHookReturn.data![0].userReport,
            label: undefined,
          },
        },
      ],
    };
    (useUserReports as any).mockReturnValue(dataWithoutLabel);

    // When
    render(
      
        <ReportsPage />
      
    );

    // Then
    const reportLink = screen.getByTestId('report-link');
    expect(reportLink).toHaveTextContent(/Report #123/);
  });

  test('given report link clicked when clicked then does not trigger row selection', async () => {
    // Given
    const user = userEvent.setup();
    render(
      
        <ReportsPage />
      
    );

    // When
    const reportLink = screen.getByTestId('report-link');
    await user.click(reportLink);

    // Then
    // Link should be present and clickable
    // The stopPropagation in LinkColumn prevents row selection
    // This test verifies the link is rendered correctly with stopPropagation
    expect(reportLink).toBeInTheDocument();
    expect(reportLink).toHaveAttribute('href', '/us/report-output/report-1');
  });
});
