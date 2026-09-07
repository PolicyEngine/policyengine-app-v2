import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import {
  ReportComputing,
  ReportUnresolvable,
  ReportWaiting,
} from '@/components/flagship/ReportComputing';

describe('ReportComputing', () => {
  test('given progress then the status, percent, and what is coming render once', () => {
    render(<ReportComputing message="Computing society-wide impacts…" progress={42.4} />);

    expect(screen.getByText('Computing society-wide impacts…')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/validation checks below run independently/i)).toBeInTheDocument();
  });

  test('given no progress yet then no percent or bar renders', () => {
    render(<ReportComputing message="Queued" />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

describe('ReportWaiting', () => {
  test('given a dependent section then it names what follows the run', () => {
    render(<ReportWaiting what="District impacts" />);

    expect(screen.getByText(/District impacts follow once the nationwide run/)).toBeInTheDocument();
  });
});

describe('ReportUnresolvable', () => {
  test('given a local-only link then the page says so and how to get a shareable one', () => {
    render(<ReportUnresolvable />);

    expect(screen.getByText(/only opens in the browser that ran the report/i)).toBeInTheDocument();
    expect(screen.getByText(/shareable id/i)).toBeInTheDocument();
  });
});
