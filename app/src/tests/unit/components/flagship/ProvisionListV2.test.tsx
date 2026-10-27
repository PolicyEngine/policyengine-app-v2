import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import ProvisionList from '@/components/flagship/ProvisionList';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogVariablesEnvelope } from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import {
  jsonResponse,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { seedV2ModelCatalog, testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const VARIABLES_PATH = '/v2/model-catalog/variables';

/** A reform that adds SSI to the benefits a household's total counts. */
const LIST_PROVISION = {
  path: 'gov.household.household_benefits',
  breadcrumb: 'Household → Benefits',
  unit: null,
  baselineValue: ['snap'],
  value: ['snap', 'ssi'],
};

let answerVariables: () => Response | Promise<Response>;

function renderWithQueries(ui: React.ReactNode) {
  return render(<QueryClientProvider client={testQueryClient()}>{ui}</QueryClientProvider>);
}

describe('ProvisionList with v3 on the v2 routes', () => {
  beforeEach(async () => {
    answerVariables = () => jsonResponse(catalogVariablesEnvelope());
    stubPublicApiFetch({ [VARIABLES_PATH]: () => answerVariables() });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the variables still loading then a provision list waits for their names', () => {
    // Given
    answerVariables = () => new Promise<Response>(() => {});

    // When
    renderWithQueries(<ProvisionList provisions={[LIST_PROVISION]} />);

    // Then
    expect(screen.getByRole('status', { name: 'Loading variable names' })).toBeInTheDocument();
    expect(screen.queryByText(/ssi/)).not.toBeInTheDocument();
  });

  test('given the variables arrive then a provision list names them by label', async () => {
    // When
    renderWithQueries(<ProvisionList provisions={[LIST_PROVISION]} />);

    // Then
    expect(await screen.findByText(/SSI/)).toBeInTheDocument();
    expect(
      screen.queryByRole('status', { name: 'Loading variable names' })
    ).not.toBeInTheDocument();
  });

  test('given the variables fail then the provision list says so and try again asks again', async () => {
    // Given
    const user = userEvent.setup();
    let attempts = 0;
    answerVariables = () => {
      attempts += 1;
      return attempts === 1
        ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
        : jsonResponse(catalogVariablesEnvelope());
    };
    renderWithQueries(<ProvisionList provisions={[LIST_PROVISION]} />);
    const [retry] = await screen.findAllByRole('button', { name: 'Try again' });
    expect(screen.getAllByText('Could not load the variable names').length).toBeGreaterThan(0);

    // When
    await user.click(retry);

    // Then
    expect((await screen.findAllByText(/SSI/)).length).toBeGreaterThan(0);
    expect(screen.queryByText('Could not load the variable names')).not.toBeInTheDocument();
  });
});
