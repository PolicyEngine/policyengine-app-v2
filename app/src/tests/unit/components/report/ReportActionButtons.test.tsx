import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';

describe('ReportActionButtons', () => {
  let clipboardWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: clipboardWriteText,
      },
      configurable: true,
    });
  });

  test('given isSharedView=true then renders save and the standard action buttons', () => {
    // Given
    render(
      <ReportActionButtons
        isSharedView
        shareUrl="https://app.policyengine.org/us/report-output/sur-abc123?share=abc"
        onSave={vi.fn()}
        onView={vi.fn()}
        onReproduce={vi.fn()}
      />
    );

    // Then
    expect(screen.getByRole('button', { name: /save report to my reports/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reproduce in python/i })).toBeInTheDocument();
  });

  test('given isSharedView=false then renders reproduce, view, and share buttons', () => {
    // Given
    render(
      <ReportActionButtons
        isSharedView={false}
        shareUrl="https://app.policyengine.org/us/report-output/sur-abc123?share=abc"
        onView={vi.fn()}
        onReproduce={vi.fn()}
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

  test('given share url then copies the link and shows confirmation when share clicked', async () => {
    // Given
    const user = userEvent.setup();
    const shareUrl = 'https://app.policyengine.org/us/report-output/sur-abc123?share=abc';
    render(<ReportActionButtons isSharedView={false} shareUrl={shareUrl} />);

    // When
    await user.click(screen.getByRole('button', { name: /share/i }));

    // Then
    expect(screen.getByText(/share link copied/i)).toBeInTheDocument();
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
