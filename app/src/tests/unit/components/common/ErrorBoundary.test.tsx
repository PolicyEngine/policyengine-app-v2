import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Component that throws an error for testing
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Content rendered successfully</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error during tests since we're intentionally causing errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  test('given children that render successfully then children are displayed', () => {
    // Given
    render(
      <ErrorBoundary fallback={<div>Error fallback</div>}>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // Then
    expect(screen.getByText('Content rendered successfully')).toBeInTheDocument();
    expect(screen.queryByText('Error fallback')).not.toBeInTheDocument();
  });

  test('given children that throw error then fallback is displayed', () => {
    // Given
    render(
      <ErrorBoundary fallback={<div>Error fallback</div>}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );

    // Then
    expect(screen.getByText('Error fallback')).toBeInTheDocument();
    expect(screen.queryByText('Content rendered successfully')).not.toBeInTheDocument();
  });

  test('given fallback function then it receives error and errorInfo', () => {
    // Given
    const fallbackFn = vi.fn((error: Error) => <div>Error: {error.message}</div>);

    render(
      <ErrorBoundary fallback={fallbackFn}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );

    // Then
    expect(fallbackFn).toHaveBeenCalled();
    expect(fallbackFn.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(fallbackFn.mock.calls[0][0].message).toBe('Test error message');
    expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
  });

  test('given onError callback then it is called when error occurs', () => {
    // Given
    const onError = vi.fn();

    render(
      <ErrorBoundary fallback={<div>Error fallback</div>} onError={onError}>
        <ThrowingComponent shouldThrow />
      </ErrorBoundary>
    );

    // Then
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error message');
  });

  test('given multiple children with one throwing then fallback is displayed', () => {
    // Given
    render(
      <ErrorBoundary fallback={<div>Error fallback</div>}>
        <div>First child</div>
        <ThrowingComponent shouldThrow />
        <div>Third child</div>
      </ErrorBoundary>
    );

    // Then
    expect(screen.getByText('Error fallback')).toBeInTheDocument();
    expect(screen.queryByText('First child')).not.toBeInTheDocument();
    expect(screen.queryByText('Third child')).not.toBeInTheDocument();
  });
});
