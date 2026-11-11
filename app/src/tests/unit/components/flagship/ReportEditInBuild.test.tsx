import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportAdjustPanel from '@/components/flagship/ReportAdjustPanel';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import { readReportMeta, saveReportMeta } from '@/libs/flagship/runReport';
import { currentMeta, GROWING_PROVISION } from '@/tests/fixtures/libs/flagship/reportSchemaMocks';

// A report's stored provenance, read back through the report schema,
// going back to Build from the Adjust panel (ReportAdjustPanel.test.tsx
// covers the panel with provisions handed to it).

const REPORT_ID = '4512';

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: vi.fn(), isRunning: false, error: null }),
}));

const mockPush = vi.fn();

vi.mock('@/contexts/NavigationContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/NavigationContext')>();
  return { ...actual, useAppNavigate: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }) };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ countryId: 'us' }) };
});

describe('ReportAdjustPanel with stored provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    clearDraftReform();
  });

  test('given a stored provision that grows then Edit in Build keeps its growth', async () => {
    const user = userEvent.setup();
    saveReportMeta(REPORT_ID, currentMeta);
    const meta = readReportMeta(REPORT_ID)!;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportAdjustPanel
          title={meta.title}
          sourceNote={meta.sourceNote}
          provisions={meta.provisions}
          year="2026"
        />
      </QueryClientProvider>
    );

    await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));
    await user.click(screen.getByRole('button', { name: /edit in build/i }));

    expect(mockPush).toHaveBeenCalledWith('/us/build');
    const growing = getDraftReform()?.provisions.find(
      (provision) => provision.path === GROWING_PROVISION.path
    );
    expect(growing).toMatchObject({
      growth: GROWING_PROVISION.growth,
      growthStart: GROWING_PROVISION.growthStart,
      growthBase: GROWING_PROVISION.growthBase,
      growthRoundTo: GROWING_PROVISION.growthRoundTo,
      growthRound: GROWING_PROVISION.growthRound,
      intervals: GROWING_PROVISION.intervals,
    });
  });
});
