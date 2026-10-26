import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import BillTrackerLink from '@/components/flagship/BillTrackerLink';
import { TRACKER_HOME } from '@/tests/fixtures/libs/flagship/billTrackerMocks';

describe('BillTrackerLink', () => {
  test('given a tracker page then the link opens it in a new tab', () => {
    render(<BillTrackerLink href={`${TRACKER_HOME}/ks/ks-hb2620`} />);

    const link = screen.getByRole('link', { name: 'Bill tracker' });
    expect(link).toHaveAttribute('href', `${TRACKER_HOME}/ks/ks-hb2620`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });
});
