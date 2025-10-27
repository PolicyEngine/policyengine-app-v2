import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render as testRender, screen } from '@testing-library/react';
import { ReportOutputTypeCell } from '@/components/report/ReportOutputTypeCell';
import { calculationKeys } from '@/libs/queryKeys';
import {
  createMockPendingStatus,
  createMockErrorStatus,
} from '@/tests/fixtures/hooks/useCalcStatusSubscriptionMocks';
import {
  createMockReportWithOutput,
  createMockReportWithoutOutput,
  TEST_REPORT_IDS,
  TEST_PROGRESS_VALUES,
} from '@/tests/fixtures/components/report/ReportOutputTypeCellMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

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
        <MantineProvider>{component}</MantineProvider>
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
    // Spinner is rendered via Mantine Loader component (it's a span, not a role)
    const loader = document.querySelector('.mantine-Loader-root');
    expect(loader).toBeInTheDocument();
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

    // Then
    const loader = document.querySelector('.mantine-Loader-root');
    expect(loader).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('given complete report with output then displays Society-wide', () => {
    // Given
    const report = createMockReportWithOutput(TEST_REPORT_IDS.REPORT_789);

    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_789} report={report} />);

    // Then
    expect(screen.getByText('Society-wide')).toBeInTheDocument();
  });

  it('given complete report without output then displays Not generated', () => {
    // Given
    const report = createMockReportWithoutOutput(TEST_REPORT_IDS.REPORT_999);

    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_999} report={report} />);

    // Then
    expect(screen.getByText('Not generated')).toBeInTheDocument();
  });

  it('given no cached status then displays Not generated', () => {
    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_NO_CACHE} />);

    // Then
    expect(screen.getByText('Not generated')).toBeInTheDocument();
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

  it('given error status then displays Not generated', () => {
    // Given
    const errorStatus = createMockErrorStatus(TEST_REPORT_IDS.REPORT_ERROR, 'societyWide', 'Calculation failed');
    queryClient.setQueryData(calculationKeys.byReportId(TEST_REPORT_IDS.REPORT_ERROR), errorStatus);

    // When
    render(<ReportOutputTypeCell reportId={TEST_REPORT_IDS.REPORT_ERROR} />);

    // Then
    expect(screen.getByText('Not generated')).toBeInTheDocument();
  });
});
