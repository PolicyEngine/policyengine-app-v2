import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportLoadError from '@/components/flagship/report/ReportLoadError';

const mockPush = vi.fn();

vi.mock('@/contexts/NavigationContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/NavigationContext')>();
  return { ...actual, useAppNavigate: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }) };
});

describe('ReportLoadError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given a link that names no report then it says not found, with no retry', () => {
    render(<ReportLoadError notFound onRetry={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Report not found' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  test('given a report not found then your reforms is one click away', async () => {
    const user = userEvent.setup();
    render(<ReportLoadError notFound onRetry={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Your reforms' }));

    expect(mockPush).toHaveBeenCalledWith('/us/reforms?filter=yours');
  });

  test('given a failed load then try again asks for the report again', async () => {
    // Given
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ReportLoadError notFound={false} onRetry={onRetry} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(screen.getByRole('heading', { name: 'Could not load the report' })).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('given a failed load then back to Build leaves for Build', async () => {
    const user = userEvent.setup();
    render(<ReportLoadError notFound={false} onRetry={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Back to Build' }));

    expect(mockPush).toHaveBeenCalledWith('/us/build');
  });
});
