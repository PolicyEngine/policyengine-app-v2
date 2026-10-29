import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  addDraftProvision,
  clearDraftReform,
  getDraftReform,
  setDraftBaseline,
  startDraftReform,
} from '@/libs/draftReform';
import { growthIndexPaths } from '@/libs/flagship/uprating';
import BuildPage from '@/pages/flagship/Build.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  CTC_FIRST_BRACKET_AMOUNT,
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
  US_SEARCH_FILE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { seedV2ModelCatalog, testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import type { Reform } from '@/types/ingredients/Reform';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

/** The saved reforms Build offers as the comparison; none unless a test names them. */
const mockFindMine = vi.fn(async (): Promise<Reform[]> => []);
vi.mock('@/api/reformStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/reformStore')>()),
  getReformStore: () => ({ findMine: mockFindMine }),
}));

const SEARCH_FILE_PATH = '/v2/parameters/search-file';
const PARAMETERS_PATH = '/v2/model-catalog/parameters';

const SINGLE_DEDUCTION = {
  path: STANDARD_DEDUCTION_SINGLE,
  breadcrumb: 'IRS → Standard deduction → Single',
  unit: 'currency-USD',
  baselineValue: 15000,
  value: 15000,
};

function renderPage() {
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <BuildPage />
    </QueryClientProvider>
  );
}

function stubCatalog(
  searchFile: () => Response | Promise<Response> = () => jsonResponse(US_SEARCH_FILE)
) {
  return stubPublicApiFetch({
    [SEARCH_FILE_PATH]: searchFile,
    [PARAMETERS_PATH]: (url) =>
      jsonResponse({
        status: 'ok',
        message: null,
        result: catalogParametersResult(url.searchParams.getAll('name')),
      }),
  });
}

describe('BuildPage with v3 on the v2 routes', () => {
  beforeEach(() => {
    localStorage.clear();
    clearDraftReform();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given a draft then it waits for its parameters: its own at once, its groups once the search file names them', async () => {
    // Given
    const fetchStub = stubCatalog();
    await seedV2ModelCatalog();
    startDraftReform('us', 'manual');
    addDraftProvision('us', SINGLE_DEDUCTION);

    // When
    renderPage();

    // Then
    expect(screen.getAllByRole('status', { name: 'Loading parameters' })).toHaveLength(1);
    await waitFor(() =>
      expect(screen.queryByRole('status', { name: 'Loading parameters' })).not.toBeInTheDocument()
    );
    const requestedNames = requestsTo(fetchStub, PARAMETERS_PATH).map((url) =>
      url.searchParams.getAll('name').sort()
    );
    // While the search file downloads, the draft's own parameters and the
    // growth indexes load; the breakdown's other member follows the file.
    expect(requestedNames).toEqual([
      [STANDARD_DEDUCTION_SINGLE, ...growthIndexPaths('us')].sort(),
      [STANDARD_DEDUCTION_JOINT],
    ]);
    expect(requestsTo(fetchStub, SEARCH_FILE_PATH)).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: 'Search parameters' })).toBeInTheDocument();
  });

  test("given the draft's parameters still loading then its Save buttons wait for current law", async () => {
    // Given: a changed value, which saving compares with current law.
    let releaseParameters: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      releaseParameters = resolve;
    });
    stubPublicApiFetch({
      [SEARCH_FILE_PATH]: () => jsonResponse(US_SEARCH_FILE),
      [PARAMETERS_PATH]: async (url) => {
        await held;
        return jsonResponse({
          status: 'ok',
          message: null,
          result: catalogParametersResult(url.searchParams.getAll('name')),
        });
      },
    });
    await seedV2ModelCatalog();
    startDraftReform('us', 'manual');
    addDraftProvision('us', { ...SINGLE_DEDUCTION, value: 20000 });
    const saveButtons = () => [
      screen.getByRole('button', { name: 'Save' }),
      screen.getByRole('button', { name: /Save and run/ }),
    ];

    // When
    renderPage();

    // Then
    expect(screen.getAllByRole('status', { name: 'Loading parameters' })).toHaveLength(1);
    for (const button of saveButtons()) {
      expect(button).toBeDisabled();
    }
    releaseParameters();
    await waitFor(() =>
      expect(screen.queryByRole('status', { name: 'Loading parameters' })).not.toBeInTheDocument()
    );
    for (const button of saveButtons()) {
      expect(button).toBeEnabled();
    }
  });

  test('given the search file has not arrived then the page keeps its loading state, with no time limit', async () => {
    stubCatalog(() => new Promise<Response>(() => {}));
    await seedV2ModelCatalog();
    startDraftReform('us', 'manual');
    addDraftProvision('us', SINGLE_DEDUCTION);

    renderPage();

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getAllByRole('status', { name: 'Loading parameters' })).toHaveLength(1);
  });

  test('given a search result is picked then its parameter loads and joins the draft at current law', async () => {
    // Given
    const user = userEvent.setup();
    stubCatalog();
    await seedV2ModelCatalog();
    renderPage();
    const search = await screen.findByRole('combobox', { name: 'Search parameters' });

    // When
    await user.type(search, 'standard deduction');
    const options = await screen.findAllByRole('option');
    const single = options.find((option) => /single/i.test(option.textContent ?? ''));
    await user.click(single ?? options[0]);

    // Then
    await waitFor(() => expect(getDraftReform()?.provisions).toHaveLength(1));
    const provision = getDraftReform()!.provisions[0];
    expect([STANDARD_DEDUCTION_SINGLE, STANDARD_DEDUCTION_JOINT]).toContain(provision.path);
    expect(provision.baselineValue).toBe(
      provision.path === STANDARD_DEDUCTION_SINGLE ? 15000 : 30000
    );
  });

  test("given the comparison's parameters fail to load then the page says so and its run waits for them", async () => {
    // Given: a draft compared with a saved reform of the child tax credit.
    const user = userEvent.setup();
    const comparison: Reform = {
      id: 'rf-ctc',
      countryId: 'us',
      label: 'A larger child tax credit',
      parameters: [
        {
          name: CTC_FIRST_BRACKET_AMOUNT,
          values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3000 }],
        },
      ],
      baseline: 'current-law',
      provenance: { source: 'manual' },
    };
    mockFindMine.mockResolvedValue([comparison]);
    let comparisonAttempts = 0;
    stubPublicApiFetch({
      [SEARCH_FILE_PATH]: () => jsonResponse(US_SEARCH_FILE),
      [PARAMETERS_PATH]: (url) => {
        const names = url.searchParams.getAll('name');
        if (names.includes(CTC_FIRST_BRACKET_AMOUNT)) {
          comparisonAttempts += 1;
          if (comparisonAttempts === 1) {
            return jsonResponse({ status: 'error', message: 'Unavailable' }, 503);
          }
        }
        return jsonResponse({
          status: 'ok',
          message: null,
          result: catalogParametersResult(names),
        });
      },
    });
    await seedV2ModelCatalog();
    startDraftReform('us', 'manual');
    addDraftProvision('us', { ...SINGLE_DEDUCTION, value: 20000 });
    setDraftBaseline(comparison.id);
    renderPage();
    const run = () => screen.getByRole('button', { name: /Save and run/ });

    // Then
    expect(
      await screen.findByText('Could not load current law for the comparison')
    ).toBeInTheDocument();
    expect(run()).toBeDisabled();

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => expect(run()).toBeEnabled());
    expect(
      screen.queryByText('Could not load current law for the comparison')
    ).not.toBeInTheDocument();
    expect(comparisonAttempts).toBe(2);
  });
});
