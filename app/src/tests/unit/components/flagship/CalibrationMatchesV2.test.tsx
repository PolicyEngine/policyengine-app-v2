import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CalibrationMatchSection } from '@/components/flagship/CalibrationMatches';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogVariablesEnvelope } from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import {
  jsonResponse,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { seedV2ModelCatalog, testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const VARIABLES_PATH = '/v2/model-catalog/variables';

let answerVariables: () => Response | Promise<Response>;

function renderSection() {
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <CalibrationMatchSection matches={mockCalibrationMatches} />
    </QueryClientProvider>
  );
}

describe('CalibrationMatchSection with v3 on the v2 routes', () => {
  beforeEach(async () => {
    answerVariables = () => jsonResponse(catalogVariablesEnvelope());
    stubPublicApiFetch({ [VARIABLES_PATH]: () => answerVariables() });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the variables still loading then the matches wait for their names', () => {
    // Given
    answerVariables = () => new Promise<Response>(() => {});

    // When
    renderSection();

    // Then
    expect(screen.getByRole('status', { name: 'Loading variable names' })).toBeInTheDocument();
  });

  test('given the variables arrive then the matches show', async () => {
    // When
    renderSection();

    // Then
    await waitFor(() =>
      expect(
        screen.queryByRole('status', { name: 'Loading variable names' })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByRole('link', { name: /View dashboard/ })).toBeInTheDocument();
  });
});
