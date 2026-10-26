import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import V3VariablesGate from '@/components/flagship/V3VariablesGate';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogVariablesEnvelope } from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { seedV2ModelCatalog, testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const VARIABLES_PATH = '/v2/model-catalog/variables';

function renderGate() {
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <V3VariablesGate label="Loading the household builder">
        <p>Household builder</p>
      </V3VariablesGate>
    </QueryClientProvider>
  );
}

/** What the variables route answers in the current test. */
let answerVariables: () => Response | Promise<Response>;

describe('V3VariablesGate with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;

  beforeEach(async () => {
    answerVariables = () => jsonResponse(catalogVariablesEnvelope());
    fetchStub = stubPublicApiFetch({ [VARIABLES_PATH]: () => answerVariables() });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the variables still loading then a placeholder stands in, with no time limit', () => {
    // Given
    answerVariables = () => new Promise<Response>(() => {});

    // When
    renderGate();

    // Then
    expect(screen.getByRole('status', { name: 'Loading the household builder' })).toBeVisible();
    expect(screen.queryByText('Household builder')).not.toBeInTheDocument();
  });

  test('given the variables arrive then the content shows', async () => {
    // When
    renderGate();

    // Then
    expect(await screen.findByText('Household builder')).toBeInTheDocument();
    expect(store.getState().metadata.variables.age.label).toBe('Age');
  });

  test('given the variables fail then the failure shows and try again asks again', async () => {
    // Given
    const user = userEvent.setup();
    let attempts = 0;
    answerVariables = () => {
      attempts += 1;
      return attempts === 1
        ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
        : jsonResponse(catalogVariablesEnvelope());
    };
    renderGate();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Could not load the model's variables"
    );

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByText('Household builder')).toBeInTheDocument();
    expect(requestsTo(fetchStub, VARIABLES_PATH)).toHaveLength(2);
  });
});
