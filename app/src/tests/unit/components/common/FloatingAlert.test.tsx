import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { FloatingAlert } from '@/components/common/FloatingAlert';

describe('FloatingAlert', () => {
  test('given default type then renders success styling', () => {
    // Given
    render(<FloatingAlert onClose={vi.fn()}>Test message</FloatingAlert>);

    // Then
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('given children then renders message content', () => {
    // Given
    const message = 'Share link copied to clipboard!';
    render(<FloatingAlert onClose={vi.fn()}>{message}</FloatingAlert>);

    // Then
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  test('given onClose callback then calls it when close button clicked', async () => {
    // Given
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<FloatingAlert onClose={handleClose}>Message</FloatingAlert>);

    // When
    await user.click(screen.getByRole('button'));

    // Then
    expect(handleClose).toHaveBeenCalledOnce();
  });

  test('given type=info then renders with info styling', () => {
    // Given
    render(
      <FloatingAlert type="info" onClose={vi.fn()}>
        Info message
      </FloatingAlert>
    );

    // Then
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  test('given type=warning then renders with warning styling', () => {
    // Given
    render(
      <FloatingAlert type="warning" onClose={vi.fn()}>
        Warning message
      </FloatingAlert>
    );

    // Then
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  test('given type=error then renders with error styling', () => {
    // Given
    render(
      <FloatingAlert type="error" onClose={vi.fn()}>
        Error message
      </FloatingAlert>
    );

    // Then
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
