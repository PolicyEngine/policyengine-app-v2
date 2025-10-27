import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render as testRender, screen } from '@testing-library/react';
import { ReportOutputTypeCell } from '@/components/report/ReportOutputTypeCell';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';

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
    const reportId = 'report-123';
    const pendingStatus: CalcStatus = {
      status: 'pending',
      progress: 42,
      message: 'Running society-wide calculation...',
      metadata: {
        calcId: reportId,
        calcType: 'societyWide',
        targetType: 'report',
        startedAt: Date.now(),
      },
    };
    queryClient.setQueryData(calculationKeys.byReportId(reportId), pendingStatus);

    // When
    render(<ReportOutputTypeCell reportId={reportId} />);

    // Then
    expect(screen.getByText('42%')).toBeInTheDocument();
    // Spinner is rendered via Mantine Loader component (it's a span, not a role)
    const loader = document.querySelector('.mantine-Loader-root');
    expect(loader).toBeInTheDocument();
  });

  it('given pending calculation with no progress then displays spinner without percentage', () => {
    // Given
    const reportId = 'report-456';
    const pendingStatus: CalcStatus = {
      status: 'pending',
      message: 'Starting...',
      metadata: {
        calcId: reportId,
        calcType: 'societyWide',
        targetType: 'report',
        startedAt: Date.now(),
      },
    };
    queryClient.setQueryData(calculationKeys.byReportId(reportId), pendingStatus);

    // When
    render(<ReportOutputTypeCell reportId={reportId} />);

    // Then
    const loader = document.querySelector('.mantine-Loader-root');
    expect(loader).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('given complete report with output then displays Society-wide', () => {
    // Given
    const reportId = 'report-789';
    const report: Report = {
      id: reportId,
      countryId: 'us',
      apiVersion: '1.0.0',
      simulationIds: ['sim-1', 'sim-2'],
      status: 'complete',
      output: { some: 'economy data' },
    } as Report;

    // When
    render(<ReportOutputTypeCell reportId={reportId} report={report} />);

    // Then
    expect(screen.getByText('Society-wide')).toBeInTheDocument();
  });

  it('given complete report without output then displays Not generated', () => {
    // Given
    const reportId = 'report-999';
    const report: Report = {
      id: reportId,
      countryId: 'us',
      apiVersion: '1.0.0',
      simulationIds: ['sim-1', 'sim-2'],
      status: 'complete',
    } as Report;

    // When
    render(<ReportOutputTypeCell reportId={reportId} report={report} />);

    // Then
    expect(screen.getByText('Not generated')).toBeInTheDocument();
  });

  it('given no cached status then displays Not generated', () => {
    // Given
    const reportId = 'report-no-cache';

    // When
    render(<ReportOutputTypeCell reportId={reportId} />);

    // Then
    expect(screen.getByText('Not generated')).toBeInTheDocument();
  });

  it('given progress at 95% then displays rounded percentage', () => {
    // Given
    const reportId = 'report-cap';
    const pendingStatus: CalcStatus = {
      status: 'pending',
      progress: 95.4,
      metadata: {
        calcId: reportId,
        calcType: 'societyWide',
        targetType: 'report',
        startedAt: Date.now(),
      },
    };
    queryClient.setQueryData(calculationKeys.byReportId(reportId), pendingStatus);

    // When
    render(<ReportOutputTypeCell reportId={reportId} />);

    // Then
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('given error status then displays Not generated', () => {
    // Given
    const reportId = 'report-error';
    const errorStatus: CalcStatus = {
      status: 'error',
      error: {
        code: 'SOCIETY_WIDE_CALC_ERROR',
        message: 'Calculation failed',
        retryable: true,
      },
      metadata: {
        calcId: reportId,
        calcType: 'societyWide',
        targetType: 'report',
        startedAt: Date.now(),
      },
    };
    queryClient.setQueryData(calculationKeys.byReportId(reportId), errorStatus);

    // When
    render(<ReportOutputTypeCell reportId={reportId} />);

    // Then
    expect(screen.getByText('Not generated')).toBeInTheDocument();
  });
});
