import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import {
  metaFromRunBridge,
  NEWER_SCHEMA_VERSION,
  REPORT_META_KEY,
} from '@/tests/fixtures/libs/flagship/reportSchemaMocks';

// The report page reading its stored provenance through the report
// schema, from real localStorage (Report.test.tsx stubs the read).

const REPORT_ID = 'r1';
const UNREADABLE_HEADING = "Could not read this report's saved details";
const WAITING_TEXT = 'Calculating the nationwide results';

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => ({
    report: { id: 'r1', countryId: 'us', year: '2026', label: 'Test Reform' },
    simulations: [
      { id: 's1', populationId: 'us', policyId: '2' },
      { id: 's2', populationId: 'us', policyId: '9' },
    ],
    policies: [],
    isLoading: false,
    failedPolicyIds: [],
  }),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => ({
    status: 'pending',
    isComplete: false,
    isError: false,
    progress: 20,
    result: null,
  }),
}));

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: () => undefined,
}));

vi.mock('@/hooks/useReportValidationSnapshot', () => ({
  useReportValidationSnapshot: () => undefined,
}));

vi.mock('@/components/flagship/CalibrationMatches', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/CalibrationMatches')>()),
  useCalibrationMatches: () => null,
}));

vi.mock('@/components/flagship/ValidationPanel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/ValidationPanel')>()),
  useModelTrackRecord: () => null,
}));

vi.mock('@/utils/reportSimulations', () => ({
  allSimulationsLoaded: () => true,
}));

function seedMeta(stored: unknown): void {
  localStorage.setItem(REPORT_META_KEY, JSON.stringify({ [REPORT_ID]: stored }));
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId={REPORT_ID} />
    </QueryClientProvider>
  );
}

describe('FlagshipReportPage with stored provenance it cannot read', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given damaged provenance then the page says so instead of loading', () => {
    seedMeta({ ...metaFromRunBridge, provisions: 'oops' });

    renderPage();

    expect(screen.getByRole('heading', { name: UNREADABLE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test Reform' })).toBeInTheDocument();
    expect(screen.queryByText(WAITING_TEXT)).not.toBeInTheDocument();
  });

  test('given damaged provenance opened without it then the report carries on', async () => {
    const user = userEvent.setup();
    seedMeta({ ...metaFromRunBridge, provisions: 'oops' });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Open without saved details' }));

    expect(screen.queryByRole('heading', { name: UNREADABLE_HEADING })).not.toBeInTheDocument();
    expect(screen.getByText(WAITING_TEXT)).toBeInTheDocument();
  });

  test('given damaged provenance opened without it then the next visit does not ask', async () => {
    const user = userEvent.setup();
    seedMeta({ ...metaFromRunBridge, provisions: 'oops' });
    const { unmount } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Open without saved details' }));
    unmount();

    renderPage();

    expect(screen.queryByRole('heading', { name: UNREADABLE_HEADING })).not.toBeInTheDocument();
    expect(screen.getByText(WAITING_TEXT)).toBeInTheDocument();
  });

  test('given provenance a newer version saved opened without it then the next visit asks again', async () => {
    const user = userEvent.setup();
    seedMeta({ ...metaFromRunBridge, schemaVersion: NEWER_SCHEMA_VERSION });
    const { unmount } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Open without saved details' }));
    unmount();

    renderPage();

    expect(screen.getByRole('heading', { name: UNREADABLE_HEADING })).toBeInTheDocument();
  });

  test('given provenance a newer version saved then reloading is offered', () => {
    seedMeta({ ...metaFromRunBridge, schemaVersion: NEWER_SCHEMA_VERSION });

    renderPage();

    expect(screen.getByRole('heading', { name: UNREADABLE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  test('given provenance from before the schema then the report opens as usual', () => {
    seedMeta(metaFromRunBridge);

    renderPage();

    expect(screen.queryByRole('heading', { name: UNREADABLE_HEADING })).not.toBeInTheDocument();
    expect(screen.getByText(WAITING_TEXT)).toBeInTheDocument();
  });
});
