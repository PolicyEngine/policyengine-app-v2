import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import BillReportStatus from '@/components/flagship/report/BillReportStatus';

const mockPush = vi.fn();

vi.mock('@/contexts/NavigationContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/NavigationContext')>();
  return { ...actual, useAppNavigate: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }) };
});

const FEED = { isLoading: false, isError: false, isConfigured: true };

describe('BillReportStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given the feed is loading then the report placeholder holds its place', () => {
    render(<BillReportStatus {...FEED} isLoading onRetry={vi.fn()} />);

    expect(screen.getByRole('status', { name: 'Loading the bill' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given the feed failed then try again asks for it again', async () => {
    // Given
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<BillReportStatus {...FEED} isError onRetry={onRetry} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the bill feed');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('given a bill the feed does not carry then all bills is the way back', async () => {
    const user = userEvent.setup();
    render(<BillReportStatus {...FEED} onRetry={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'All bills' }));

    expect(screen.getByText('This bill is not in the feed.')).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/us/reforms');
  });

  test('given no feed configured then it says so and offers Build', async () => {
    const user = userEvent.setup();
    render(<BillReportStatus {...FEED} isConfigured={false} onRetry={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Build a reform' }));

    expect(screen.getByText('The bill feed is not configured here.')).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/us/build');
  });
});
