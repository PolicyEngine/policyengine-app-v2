import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportOutputLayout from '@/pages/report-output/ReportOutputLayout';
import {
  MOCK_REPORT_ID,
  MOCK_REPORT_LABEL,
  MOCK_REPORT_YEAR,
  MOCK_TABS,
  MOCK_TIMESTAMP,
} from '@/tests/fixtures/pages/report-output/ReportOutputLayoutMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

vi.mock('@/components/report/SharedReportTag', () => ({
  SharedReportTag: () => <span data-testid="shared-report-tag">Shared</span>,
}));

describe('ReportOutputLayout', () => {
  test('given report year then year is displayed in metadata line', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
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
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
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
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
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
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
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
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
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
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
      >
        <div>Test Content</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.getByText(MOCK_TIMESTAMP)).toBeInTheDocument();
  });

  test('given tabs then all tabs are rendered', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
      >
        <div>Test Content</div>
      </ReportOutputLayout>
    );

    // Then
    MOCK_TABS.forEach((tab) => {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    });
  });

  test('given active tab then tab is highlighted', () => {
    // Given
    const activeTab = 'comparative-analysis';
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
        tabs={MOCK_TABS}
        activeTab={activeTab}
        onTabChange={vi.fn()}
      >
        <div>Test Content</div>
      </ReportOutputLayout>
    );

    // Then
    const activeTabElement = screen.getByText('Comparative analysis');
    expect(activeTabElement).toBeInTheDocument();
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
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
      >
        <div>{testContent}</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  test('given isSharedView=true then shows SharedReportTag and save button', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
        isSharedView
        onSave={vi.fn()}
      >
        <div>Content</div>
      </ReportOutputLayout>
    );

    // Then
    expect(screen.getByTestId('shared-report-tag')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save report to my reports/i })).toBeInTheDocument();
  });

  test('given isSharedView=false then shows view, edit, and share buttons', () => {
    // Given
    render(
      <ReportOutputLayout
        reportId={MOCK_REPORT_ID}
        reportLabel={MOCK_REPORT_LABEL}
        reportYear={MOCK_REPORT_YEAR}
        timestamp={MOCK_TIMESTAMP}
        tabs={MOCK_TABS}
        activeTab="overview"
        onTabChange={vi.fn()}
        isSharedView={false}
        onShare={vi.fn()}
        onView={vi.fn()}
        onReproduce={vi.fn()}
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
});
