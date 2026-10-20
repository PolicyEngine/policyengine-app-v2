import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportNotSocietyWide from '@/components/flagship/report/ReportNotSocietyWide';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: vi.fn(() => 'us') }));

describe('ReportNotSocietyWide', () => {
  test('given a US household report then it names nationwide and state results', () => {
    render(<ReportNotSocietyWide />);

    expect(
      screen.getByText(
        'It is a household report. This page shows nationwide and state results only.'
      )
    ).toBeInTheDocument();
  });

  test('given a UK household report then it names UK-wide and nation results', () => {
    vi.mocked(useCurrentCountry).mockReturnValue('uk');
    render(<ReportNotSocietyWide />);

    expect(
      screen.getByText('It is a household report. This page shows UK-wide and nation results only.')
    ).toBeInTheDocument();
  });
});
