import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ReportActionButtons } from '@/components/report/ReportActionButtons';

describe('ReportActionButtons', () => {
  test('given isSharedView=true then renders save button only', () => {
    // Given
    render(<ReportActionButtons isSharedView onSave={vi.fn()} />);

    // Then
    expect(screen.getByRole('button', { name: /save report to my reports/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /share report/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view\/edit report/i })).not.toBeInTheDocument();
  });

  test('given isSharedView=false then renders view/edit and share buttons', () => {
    // Given
    render(<ReportActionButtons isSharedView={false} onShare={vi.fn()} onModify={vi.fn()} />);

    // Then
    expect(screen.getByRole('button', { name: /share report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view\/edit report/i })).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: /share report/i }));

    // Then
    expect(handleShare).toHaveBeenCalledOnce();
  });

  test('given onModify callback then calls it when view/edit clicked', async () => {
    // Given
    const user = userEvent.setup();
    const handleModify = vi.fn();
    render(<ReportActionButtons isSharedView={false} onModify={handleModify} />);

    // When
    await user.click(screen.getByRole('button', { name: /view\/edit report/i }));

    // Then
    expect(handleModify).toHaveBeenCalledOnce();
  });
});
