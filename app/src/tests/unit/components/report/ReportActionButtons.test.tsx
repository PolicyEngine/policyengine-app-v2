import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';

describe('ReportActionButtons', () => {
  test('given isSharedView=true then renders save button only', () => {
    // Given
    render(<ReportActionButtons isSharedView onSave={vi.fn()} />);

    // Then
    expect(screen.getByRole('button', { name: /save report to my reports/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument();
  });

  test('given isSharedView=false then renders view, edit, and share buttons', () => {
    // Given
    render(
      <ReportActionButtons
        isSharedView={false}
        onShare={vi.fn()}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    // Then
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
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

  test('given onShare callback then calls it when share clicked', async () => {
    // Given
    const user = userEvent.setup();
    const handleShare = vi.fn();
    render(<ReportActionButtons isSharedView={false} onShare={handleShare} />);

    // When
    await user.click(screen.getByRole('button', { name: /share/i }));

    // Then
    expect(handleShare).toHaveBeenCalledOnce();
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

  test('given onEdit callback then calls it when edit clicked', async () => {
    // Given
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    render(<ReportActionButtons isSharedView={false} onEdit={handleEdit} />);

    // When
    await user.click(screen.getByRole('button', { name: /edit/i }));

    // Then
    expect(handleEdit).toHaveBeenCalledOnce();
  });
});
