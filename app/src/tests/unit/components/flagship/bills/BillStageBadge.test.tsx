import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import BillStageBadge from '@/components/flagship/bills/BillStageBadge';
import { colors } from '@/designTokens';

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

  test('given a failed bill then its badge text is readable, not the disabled gray', () => {
    render(<BillStageBadge status="Dead/Withdrawn" />);

    // text.tertiary is for disabled text and fails AA at badge size.
    expect(screen.getByText('Failed')).toHaveStyle({
      color: colors.text.secondary,
      borderColor: colors.border.medium,
    });
  });

  test('given no status the tracker follows then no badge shows', () => {
    const { container } = render(<BillStageBadge status="Analyzed" />);

    expect(container.querySelector('[data-slot="badge"]')).toBeNull();
  });
});
