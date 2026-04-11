import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportOutputLayout from '@/pages/report-output/ReportOutputLayout';
import {
  MOCK_REPORT_ID,
  MOCK_REPORT_LABEL,
  MOCK_REPORT_YEAR,
  MOCK_SHARE_URL,
  MOCK_TIMESTAMP,
} from '@/tests/fixtures/pages/report-output/ReportOutputLayoutMocks';

const mockPush = vi.fn();

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
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
    }),
  };
});

vi.mock('@/components/report/SharedReportTag', () => ({
  SharedReportTag: () => <span data-testid="shared-report-tag">Shared</span>,
}));

describe('ReportOutputLayout', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  test('given report year then year is displayed in metadata line', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
      >
        <div>Test Content</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.getByText(`Year: ${MOCK_REPORT_YEAR}`)).toBeInTheDocument();
  });

  test('given no report year then year is not displayed', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        timestamp={MOCK_TIMESTAMP}
      >
        <div>Test Content</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.queryByText(/Year:/)).not.toBeInTheDocument();
  });

  test('given report year then separator bullet is displayed', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
      >
        <div>Test Content</div>
      </ReportOutputLayout>
    );

    // Then
    const metadataContainer = screen.getByText(`Year: ${MOCK_REPORT_YEAR}`).closest('div');
    expect(metadataContainer).toHaveTextContent('•');
  });

  test('given report label then label is displayed as title', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
      >
        <div>Test Content</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.getByRole('heading', { name: MOCK_REPORT_LABEL })).toBeInTheDocument();
  });

  test('given no report label then report ID is displayed', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
      >
        <div>Test Content</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.getByRole('heading', { name: MOCK_REPORT_ID })).toBeInTheDocument();
  });

  test('given timestamp then timestamp is displayed', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
      >
        <div>Test Content</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.getByText(MOCK_TIMESTAMP)).toBeInTheDocument();
  });

  test('given children then children are rendered', () => {
    // Given
    const testContent = 'Test Child Content';
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
      >
        <div>{testContent}</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  test('given isSharedView=true then shows shared actions including save and view setup', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
        isSharedView
        onSave={vi.fn()}
        onView={vi.fn()}
        onReproduce={vi.fn()}
        shareUrl={MOCK_SHARE_URL}
      >
        <div>Content</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.getByTestId('shared-report-tag')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save report to my reports/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view report setup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reproduce in python/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  test('given isSharedView=false then shows view, reproduce, and share buttons', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
        isSharedView={false}
        onView={vi.fn()}
        onReproduce={vi.fn()}
        shareUrl={MOCK_SHARE_URL}
      >
        <div>Content</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.queryByTestId('shared-report-tag')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reproduce in python/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
  });

  test('given back path then breadcrumb returns to the originating report page', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
        backPath="/us/report-output/report-123/overview?share=abc"
        backLabel="Test Report"
      >
        <div>Content</div>
      </ReportOutputLayout>
    );

    // When
    await user.click(screen.getByText(/back to test report/i));

    // Then
    expect(mockPush).toHaveBeenCalledWith('/us/report-output/report-123/overview?share=abc');
  });
});
