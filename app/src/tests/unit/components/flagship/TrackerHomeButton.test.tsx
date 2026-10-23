import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import TrackerHomeButton from '@/components/flagship/TrackerHomeButton';
import { TRACKER_HOME } from '@/tests/fixtures/libs/flagship/billTrackerMocks';

describe('TrackerHomeButton', () => {
  test('given the home button then it links to the tracker home in a new tab', () => {
    render(<TrackerHomeButton />);

    const link = screen.getByRole('link', { name: 'Bill tracker' });
    expect(link).toHaveAttribute('href', TRACKER_HOME);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });
});
