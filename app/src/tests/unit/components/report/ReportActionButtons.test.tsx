import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';

const TEST_SHARE_URL = 'https://app.policyengine.org/us/report-output/test-report?share=abc123';

describe('ReportActionButtons', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  test('given isSharedView=true then renders save, view, reproduce, and share buttons', () => {
    // Given
    render(
      <ReportActionButtons
        isSharedView
        onSave={vi.fn()}
        onView={vi.fn()}
        onReproduce={vi.fn()}
        shareUrl={TEST_SHARE_URL}
      />
    );

    // Then
    expect(screen.getByRole('button', { name: /save report to my reports/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view report setup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reproduce in python/i })).toBeInTheDocument();
  });

  test('given isSharedView=false then renders reproduce, view, and share buttons', () => {
    // Given
    render(
      <ReportActionButtons
        isSharedView={false}
        onView={vi.fn()}
        onReproduce={vi.fn()}
        shareUrl={TEST_SHARE_URL}
      />
    );

    // Then
    expect(screen.getByRole('button', { name: /reproduce in python/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save report/i })).not.toBeInTheDocument();
  });

  test('given onSave callback then calls it when save clicked', async () => {
    // Given
    const user = userEvent.setup();
    const handleSave = vi.fn();
    render(<ReportActionButtons isSharedView onSave={handleSave} />);

    // When
    await user.click(screen.getByRole('button', { name: /save report to my reports/i }));

    // Then
    expect(handleSave).toHaveBeenCalledOnce();
  });

  test('given share url then copies immediately and shows confirmation without raw link', async () => {
    // Given
    const user = userEvent.setup();
    render(<ReportActionButtons isSharedView={false} shareUrl={TEST_SHARE_URL} />);

    // When
    await user.click(screen.getByRole('button', { name: /share/i }));

    // Then
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TEST_SHARE_URL);
    expect(screen.getByText(/link copied to clipboard/i)).toBeInTheDocument();
    expect(screen.queryByText(TEST_SHARE_URL)).not.toBeInTheDocument();
  });

  test('given onReproduce callback then calls it when reproduce clicked', async () => {
    // Given
    const user = userEvent.setup();
    const handleReproduce = vi.fn();
    render(<ReportActionButtons isSharedView={false} onReproduce={handleReproduce} />);

    // When
    await user.click(screen.getByRole('button', { name: /reproduce in python/i }));

    // Then
    expect(handleReproduce).toHaveBeenCalledOnce();
  });

  test('given onView callback then calls it when view clicked', async () => {
    // Given
    const user = userEvent.setup();
    const handleView = vi.fn();
    render(<ReportActionButtons isSharedView={false} onView={handleView} />);

    // When
    await user.click(screen.getByRole('button', { name: /view/i }));

    // Then
    expect(handleView).toHaveBeenCalledOnce();
  });
});
