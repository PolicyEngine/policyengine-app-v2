import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { ReportErrorFallback } from '@/components/report/ReportErrorFallback';

const createTestError = (message: string): Error => {
  const error = new Error(message);
  error.stack = `Error: ${message}\n    at TestComponent (test.tsx:10:5)`;
  return error;
};

const createTestErrorInfo = () => ({
  componentStack: '\n    at TestComponent\n    at ErrorBoundary\n    at App',
});

describe('ReportErrorFallback', () => {
  test('given error then displays heading and error message', () => {
    // Given
    const error = createTestError('Something went wrong in the component');

    // When
    render(<ReportErrorFallback error={error} errorInfo={null} />);

    // Then
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong in the component')).toBeInTheDocument();
  });

  test('given error with stack trace then displays stack trace', () => {
    // Given
    const error = createTestError('Test error');

    // When
    render(<ReportErrorFallback error={error} errorInfo={null} />);

    // Then
    expect(screen.getByText('Stack trace')).toBeInTheDocument();
  });

  test('given errorInfo with component stack then displays component stack', () => {
    // Given
    const error = createTestError('Test error');

    // When
    render(<ReportErrorFallback error={error} errorInfo={createTestErrorInfo()} />);

    // Then
    expect(screen.getByText('Component stack')).toBeInTheDocument();
  });

  test('given error without message then displays unknown error', () => {
    // Given
    const error = new Error();
    error.message = '';

    // When
    render(<ReportErrorFallback error={error} errorInfo={null} />);

    // Then
    expect(screen.getByText('Unknown error')).toBeInTheDocument();
  });
});
