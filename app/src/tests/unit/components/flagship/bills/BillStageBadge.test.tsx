import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import BillStageBadge from '@/components/flagship/bills/BillStageBadge';

describe('BillStageBadge', () => {
  test('given a bill signed into law then the badge reads Enacted', () => {
    render(<BillStageBadge status="Signed into Law" />);

    expect(screen.getByText('Enacted')).toBeInTheDocument();
  });

  test('given a bill in committee then the badge reads Proposed', () => {
    render(<BillStageBadge status="In Committee" />);

    expect(screen.getByText('Proposed')).toBeInTheDocument();
  });

  test('given a vetoed bill then the badge reads Failed', () => {
    render(<BillStageBadge status="Vetoed" />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
