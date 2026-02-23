import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, render as testRender } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReportOutputTypeCell } from '@/components/report/ReportOutputTypeCell';
import { calculationKeys } from '@/libs/queryKeys';
import {
  createMockReportWithoutOutput,
  createMockReportWithOutput,
  TEST_PROGRESS_VALUES,
  TEST_REPORT_IDS,
} from '@/tests/fixtures/components/report/ReportOutputTypeCellMocks';
import {
  createMockErrorStatus,
  createMockPendingStatus,
} from '@/tests/fixtures/hooks/useCalcStatusSubscriptionMocks';

describe('ReportOutputTypeCell', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const render = (component: React.ReactElement) => {
    return testRender(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('given pending calculation then displays spinner and progress percentage', () => {
    // Given
    const pendingStatus = createMockPendingStatus(
      TEST_REPORT_IDS.REPORT_123,
      'societyWide',
      TEST_PROGRESS_VALUES.LOW,
      'Running society-wide calculation...'
    );
    queryClient.setQueryData(calculationKeys.byReportId(TEST_REPORT_IDS.REPORT_123), pendingStatus);

    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_123} />);

    // Then
    expect(screen.getByText('42%')).toBeInTheDocument();
    // Spinner component renders with role="status"
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('given pending calculation with no progress then displays spinner without percentage', () => {
    // Given
    const pendingStatus = createMockPendingStatus(
      TEST_REPORT_IDS.REPORT_456,
      'societyWide',
      undefined,
      'Starting...'
    );
    queryClient.setQueryData(calculationKeys.byReportId(TEST_REPORT_IDS.REPORT_456), pendingStatus);

    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_456} />);

    // Then — Spinner component renders with role="status"
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('given complete report with output then displays Complete status', () => {
    // Given
    const report = createMockReportWithOutput(TEST_REPORT_IDS.REPORT_789);

    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_789} report={report} />);

    // Then
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('given pending report without output then displays Pending status', () => {
    // Given
    const report = {
      ...createMockReportWithoutOutput(TEST_REPORT_IDS.REPORT_999),
      status: 'pending' as const,
    };

    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_999} report={report} />);

    // Then
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('given no cached status and no report then displays Initializing status', () => {
    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_NO_CACHE} />);

    // Then
    expect(screen.getByText('Initializing')).toBeInTheDocument();
  });

  it('given progress at 95% then displays rounded percentage', () => {
    // Given
    const pendingStatus = createMockPendingStatus(
      TEST_REPORT_IDS.REPORT_CAP,
      'societyWide',
      TEST_PROGRESS_VALUES.HIGH
    );
    queryClient.setQueryData(calculationKeys.byReportId(TEST_REPORT_IDS.REPORT_CAP), pendingStatus);

    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_CAP} />);

    // Then
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('given error status then displays Error status', () => {
    // Given
    const errorStatus = createMockErrorStatus(
      TEST_REPORT_IDS.REPORT_ERROR,
      'societyWide',
      'Calculation failed'
    );
    const errorReport = {
      ...createMockReportWithoutOutput(TEST_REPORT_IDS.REPORT_ERROR),
      status: 'error' as const,
    };
    queryClient.setQueryData(calculationKeys.byReportId(TEST_REPORT_IDS.REPORT_ERROR), errorStatus);

    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_ERROR} report={errorReport} />);

    // Then
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
