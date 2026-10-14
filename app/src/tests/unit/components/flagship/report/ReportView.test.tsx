import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportView from '@/components/flagship/report/ReportView';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

vi.mock('@/utils/isSocietyWideReportNoOp', () => ({
  isSocietyWideReportNoOp: () => true,
}));

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: async () => ({ status: 'computing', result: null, progress: 10 }),
}));

function renderCover(populationLabel?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportView
        title="Bigger CTC"
        sourceNote="Hand-built"
        populationLabel={populationLabel}
        provisions={[]}
        year="2026"
        output={null}
        calibration={null}
        trackRecord={null}
      />
    </QueryClientProvider>
  );
}

describe('ReportView overview', () => {
  test('given a reform that changes nothing then the overview says so first', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[]}
          year="2026"
          output={createMockSocietyWideOutput()}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );

    const panel = screen.getByRole('tabpanel');
    expect(panel.querySelector('[aria-label="No change in this year"]')).toHaveTextContent(
      'This reform changes nothing in 2026'
    );
  });

  test('given a report compared with a saved reform then the cover and the notice name it', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[]}
          customBaselineLabel="Plan B"
          year="2026"
          output={createMockSocietyWideOutput()}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Compared with: Plan B')).toBeInTheDocument();
    const notice = screen.getByRole('region', { name: 'No change in this year' });
    expect(notice).toHaveTextContent('Every result matches Plan B.');
    expect(notice).not.toHaveTextContent('matches current law');
  });
});

describe('ReportView budget window', () => {
  const renderWith = (budgetWindow?: { startYear: number; windowSize: number }) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[]}
          year="2026"
          reformPolicyId="9"
          baselinePolicyId="2"
          budgetWindow={budgetWindow}
          output={null}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );
  };

  test('given a window asked for in Build then the overview carries it', async () => {
    renderWith({ startYear: 2026, windowSize: 10 });

    expect(await screen.findByRole('region', { name: 'Budget window' })).toHaveTextContent(
      'Budget, 2026–2035'
    );
  });

  test('given no window asked for then the overview has none', () => {
    renderWith();

    expect(screen.queryByRole('region', { name: 'Budget window' })).not.toBeInTheDocument();
  });
});

describe('ReportView cover', () => {
  test('given a population then the cover reads it and the year, not how the reform was made', () => {
    renderCover('Delaware');

    expect(screen.getByRole('heading', { level: 1, name: 'Bigger CTC' })).toBeInTheDocument();
    expect(screen.getByText('Delaware · 2026')).toBeInTheDocument();
    expect(screen.queryByText(/Hand-built/)).not.toBeInTheDocument();
  });

  test('given no population then the cover has no line under the title', () => {
    renderCover();

    expect(screen.queryByText(/· 2026/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hand-built/)).not.toBeInTheDocument();
  });

  test('given current law then the cover names no comparison', () => {
    renderCover('Delaware');

    expect(screen.queryByText(/Compared with/)).not.toBeInTheDocument();
  });
});
