import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import EstimateValidation from '@/components/flagship/EstimateValidation';

const REQUEST = {
  countryId: 'us',
  label: 'CTC to $2,500',
  provisions: [{ path: 'gov.irs.credits.ctc.amount.base[0].amount', value: 2500 }],
  peEstimate: -30000000000,
  year: '2026',
};

describe('EstimateValidation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given idle state then nothing runs until the button is clicked', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    render(<EstimateValidation request={REQUEST} />);

    expect(screen.getByRole('button', { name: /find external estimates/i })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('given findings return then sources, figures, and comparability labels render', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          findings: [
            {
              source: 'Joint Committee on Taxation',
              url: 'https://www.jct.gov/publications/x',
              estimate: -33000000000,
              proposal: 'CTC increase to $2,500 (TY2026)',
              comparability: 'similar',
            },
          ],
          assessment: 'The PolicyEngine estimate sits within 10% of the JCT score.',
        }),
      }))
    );
    render(<EstimateValidation request={REQUEST} />);

    await user.click(screen.getByRole('button', { name: /find external estimates/i }));

    await waitFor(() => {
      expect(screen.getByText('Joint Committee on Taxation')).toBeInTheDocument();
    });
    expect(screen.getByText('-$33.0B')).toBeInTheDocument();
    expect(screen.getByText('Similar proposal')).toBeInTheDocument();
    expect(screen.getByText(/sits within 10%/)).toBeInTheDocument();
  });

  test('given the service errors then a retry button renders with the message', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Estimate validation is not configured' }),
      }))
    );
    render(<EstimateValidation request={REQUEST} />);

    await user.click(screen.getByRole('button', { name: /find external estimates/i }));

    await waitFor(() => {
      expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /retry external check/i })).toBeInTheDocument();
  });

  test('given no findings then an honest empty state renders', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ findings: [] }),
      }))
    );
    render(<EstimateValidation request={REQUEST} />);

    await user.click(screen.getByRole('button', { name: /find external estimates/i }));

    await waitFor(() => {
      expect(screen.getByText(/no comparable external estimates/i)).toBeInTheDocument();
    });
  });
});
