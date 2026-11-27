import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import V3VariablesGate from '@/components/flagship/V3VariablesGate';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { stubPublicApiFetch } from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';

describe('V3VariablesGate on the v1 routes (before the switch)', () => {
  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given any metadata state then the content shows at once, with no request', () => {
    // Given
    const fetchStub = stubPublicApiFetch();
    store.dispatch(clearMetadata());

    // When
    render(
      <QueryClientProvider client={testQueryClient()}>
        <V3VariablesGate label="Loading the household builder">
          <p>Household builder</p>
        </V3VariablesGate>
      </QueryClientProvider>
    );

    // Then
    expect(screen.getByText('Household builder')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(fetchStub).not.toHaveBeenCalled();
  });
});
