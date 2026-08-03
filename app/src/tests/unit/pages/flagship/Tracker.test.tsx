import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import TrackerPage from '@/pages/flagship/Tracker.page';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ countryId: 'us' }),
  };
});

function renderTracker() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TrackerPage />
    </QueryClientProvider>
  );
}

describe('TrackerPage', () => {
  beforeEach(() => {
    clearDraftReform();
  });

  test('given the feed then sample bills render with the sample-data label', () => {
    renderTracker();

    expect(screen.getByText(/sample preview/i)).toBeInTheDocument();
    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    expect(screen.getByText('Utah')).toBeInTheDocument();
  });

  test('given a bill is opened as a draft then its provisions and label load the composer', async () => {
    const user = userEvent.setup();
    renderTracker();

    await user.click(screen.getAllByRole('button', { name: /open as draft reform/i })[0]);

    const draft = getDraftReform();
    expect(draft?.source).toBe('bill');
    expect(draft?.sourceRef).toBe('ut-hb-106');
    expect(draft?.label).toContain('HB 106');
    expect(draft?.provisions[0].value).toBe(0.0445);
    expect(await screen.findByText(/here's your draft reform/i)).toBeInTheDocument();
  });

  test('given the full tracker link then it points at the proxied tracker', () => {
    renderTracker();

    const link = screen.getByRole('link', { name: /open the bill tracker/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('/us/bill-tracker'));
  });
});
