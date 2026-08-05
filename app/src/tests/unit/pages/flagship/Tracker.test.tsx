import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderWithCountry, screen, userEvent } from '@test-utils';
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

  test('given the feed then bills render as compact rows with the sample-data label', () => {
    renderTracker();

    expect(screen.getByText(/sample preview/i)).toBeInTheDocument();
    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Utah.*HB 106/ })).toBeInTheDocument();
    expect(screen.getByText(/6 of 6 bills/)).toBeInTheDocument();
    // Details stay collapsed until a row is opened
    expect(screen.queryByRole('button', { name: /open as draft reform/i })).not.toBeInTheDocument();
  });

  test('given a row is expanded then its summary and action appear in place', async () => {
    const user = userEvent.setup();
    renderTracker();

    await user.click(screen.getByRole('button', { name: /HB 106/ }));

    expect(screen.getByText(/reduces the individual income tax rate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open as draft reform/i })).toBeInTheDocument();
  });

  test('given an expanded bill is opened as a draft then the composer loads it', async () => {
    const user = userEvent.setup();
    renderTracker();

    await user.click(screen.getByRole('button', { name: /HB 106/ }));
    await user.click(screen.getByRole('button', { name: /open as draft reform/i }));

    const draft = getDraftReform();
    expect(draft?.source).toBe('bill');
    expect(draft?.sourceRef).toBe('ut-hb-106');
    expect(draft?.label).toContain('HB 106');
    expect(draft?.provisions[0].value).toBe(0.0445);
    expect(await screen.findByText(/here's your draft reform/i)).toBeInTheDocument();
  });

  test('given a status filter then only matching bills show', async () => {
    const user = userEvent.setup();
    renderTracker();

    await user.selectOptions(screen.getByRole('combobox', { name: /status filter/i }), 'Enacted');

    expect(screen.getByText(/1 of 6 bills/)).toBeInTheDocument();
    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    expect(screen.queryByText(/SNAP benefit adjustment/)).not.toBeInTheDocument();
  });

  test('given a jurisdiction filter then only that jurisdiction shows', async () => {
    const user = userEvent.setup();
    renderTracker();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /jurisdiction filter/i }),
      'Federal'
    );

    expect(screen.getByText(/2 of 6 bills/)).toBeInTheDocument();
    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
  });

  test('given a search query then bills filter by title and summary', async () => {
    const user = userEvent.setup();
    renderTracker();

    await user.type(screen.getByRole('textbox', { name: /search bills/i }), 'child credit');

    expect(screen.getByText(/child tax credit expansion/i)).toBeInTheDocument();
    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
  });

  test('given no bills match then an empty state with guidance shows', async () => {
    const user = userEvent.setup();
    renderTracker();

    await user.type(screen.getByRole('textbox', { name: /search bills/i }), 'zzz nothing');

    expect(screen.getByText(/no bills match/i)).toBeInTheDocument();
  });

  test('given the full tracker link then it points at the proxied tracker', () => {
    renderTracker();

    const link = screen.getByRole('link', { name: /full tracker/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('/us/bill-tracker'));
  });

  test('given a ?bill deep link then that bill opens with its full report expanded', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithCountry(
      <QueryClientProvider client={queryClient}>
        <TrackerPage />
      </QueryClientProvider>,
      'us',
      '/us/tracker?bill=us-ctc-expansion'
    );

    expect(screen.getByRole('button', { name: /open as draft reform/i })).toBeInTheDocument();
    expect(screen.getByText(/raises the base child tax credit/i)).toBeInTheDocument();
  });
});
