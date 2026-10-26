import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import V3PolicyBrowser from '@/components/flagship/policyBrowser/V3PolicyBrowser';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import { childrenPage } from '@/tests/fixtures/api/publicApi/parameterChildrenMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  CTC_FULLY_REFUNDABLE,
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { seedV2ModelCatalog, testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const CHILDREN_PATH = '/v2/parameters/children';
const PARAMETERS_PATH = '/v2/model-catalog/parameters';
const ADDABLE = new Set([
  STANDARD_DEDUCTION_SINGLE,
  STANDARD_DEDUCTION_JOINT,
  CTC_FULLY_REFUNDABLE,
]);

/** The browser as the add bar holds it: the open folder is the bar's state. */
function Browser({
  onAdd,
  initialPath = null,
}: {
  onAdd: (path: string) => void;
  /** A folder opened from search. */
  initialPath?: string | null;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  const valueFor = (parameterPath: string) => {
    const value = getCurrentValue(store.getState().metadata.parameters[parameterPath]?.values);
    return value === undefined ? null : formatValue(value, 'currency-USD');
  };
  return (
    <V3PolicyBrowser
      addablePaths={ADDABLE}
      draftPaths={new Set()}
      path={path}
      onNavigate={setPath}
      onAdd={onAdd}
      valueFor={valueFor}
    />
  );
}

describe('V3PolicyBrowser with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;
  let releaseFirstLevel: () => void;
  let releaseDeepLevel: () => void;

  beforeEach(async () => {
    const firstLevel = new Promise<void>((resolve) => {
      releaseFirstLevel = resolve;
    });
    const deepLevel = new Promise<void>((resolve) => {
      releaseDeepLevel = resolve;
    });
    fetchStub = stubPublicApiFetch({
      [CHILDREN_PATH]: async (url) => {
        const parentPath = url.searchParams.get('parent_path') ?? '';
        if (parentPath === 'gov') {
          await firstLevel;
        }
        if (parentPath === 'gov.irs.deductions.standard') {
          await deepLevel;
        }
        return jsonResponse(childrenPage(parentPath));
      },
      [PARAMETERS_PATH]: (url) =>
        jsonResponse({
          status: 'ok',
          message: null,
          result: catalogParametersResult(url.searchParams.getAll('name')),
        }),
    });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given a level loading then placeholders stand for it until it arrives', async () => {
    render(
      <QueryClientProvider client={testQueryClient()}>
        <Browser onAdd={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByRole('status', { name: 'Loading the policy tree' })).toBeInTheDocument();
    releaseFirstLevel();
    expect(await screen.findByRole('button', { name: 'Open IRS' })).toBeInTheDocument();
    expect(requestsTo(fetchStub, CHILDREN_PATH)).toHaveLength(1);
  });

  test('given folders are opened then each level is one request, with its trail and counts', async () => {
    // Given
    const user = userEvent.setup();
    releaseFirstLevel();
    releaseDeepLevel();
    render(
      <QueryClientProvider client={testQueryClient()}>
        <Browser onAdd={vi.fn()} />
      </QueryClientProvider>
    );

    // When
    await user.click(await screen.findByRole('button', { name: 'Open IRS' }));
    await user.click(await screen.findByRole('button', { name: 'Open Deductions' }));
    await user.click(await screen.findByRole('button', { name: 'Open Standard deduction' }));
    await user.click(await screen.findByRole('button', { name: 'Open Standard deduction amount' }));

    // Then
    const trail = screen.getByRole('navigation', { name: 'Policy tree location' });
    expect(
      within(trail)
        .getAllByRole('button')
        .map((crumb) => crumb.textContent)
    ).toEqual(['All programs', 'IRS', 'Deductions', 'Standard deduction']);
    expect(
      requestsTo(fetchStub, CHILDREN_PATH).map((url) => url.searchParams.get('parent_path'))
    ).toEqual([
      'gov',
      'gov.irs',
      'gov.irs.deductions',
      'gov.irs.deductions.standard',
      'gov.irs.deductions.standard.amount',
    ]);
    // The folder's parameters, with current law loaded in one request.
    expect(
      await screen.findByRole('button', { name: 'Add Single to your draft' })
    ).toHaveTextContent('$15,000');
    expect(screen.getByRole('button', { name: 'Add Joint to your draft' })).toHaveTextContent(
      '$30,000'
    );
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(1);
  });

  test('given a parameter is added then the browser hands its path on', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    releaseFirstLevel();
    render(
      <QueryClientProvider client={testQueryClient()}>
        <Browser onAdd={onAdd} />
      </QueryClientProvider>
    );
    await user.click(await screen.findByRole('button', { name: 'Open IRS' }));
    await user.click(await screen.findByRole('button', { name: 'Open Credits' }));
    await user.click(await screen.findByRole('button', { name: 'Open Child Tax Credit' }));
    await user.click(await screen.findByRole('button', { name: 'Open Refundable' }));

    await user.click(
      await screen.findByRole('button', { name: 'Add Fully refundable to your draft' })
    );

    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(CTC_FULLY_REFUNDABLE));
  });

  test('given a deep folder opened from search then placeholders stand for it until its levels arrive', async () => {
    // Given — the top level has arrived; a level of the trail is still loading
    releaseFirstLevel();
    render(
      <QueryClientProvider client={testQueryClient()}>
        <Browser onAdd={vi.fn()} initialPath="gov.irs.deductions.standard.amount" />
      </QueryClientProvider>
    );
    await waitFor(() =>
      expect(
        requestsTo(fetchStub, CHILDREN_PATH).map((url) => url.searchParams.get('parent_path'))
      ).toContain('gov')
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Then — no top-level grid in the meantime
    expect(screen.getByRole('status', { name: 'Loading the policy tree' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open IRS' })).not.toBeInTheDocument();

    // When
    releaseDeepLevel();

    // Then
    expect(
      await screen.findByRole('button', { name: 'Add Single to your draft' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open IRS' })).not.toBeInTheDocument();
  });

  test('given a folder the tree does not hold then the top level shows', async () => {
    releaseFirstLevel();
    releaseDeepLevel();
    render(
      <QueryClientProvider client={testQueryClient()}>
        <Browser onAdd={vi.fn()} initialPath="gov.irs.not_a_folder" />
      </QueryClientProvider>
    );

    expect(await screen.findByRole('button', { name: 'Open IRS' })).toBeInTheDocument();
  });

  describe("given an open folder's parameters", () => {
    const FOLDER = 'gov.irs.deductions.standard.amount';

    function renderFolder() {
      releaseFirstLevel();
      releaseDeepLevel();
      render(
        <QueryClientProvider client={testQueryClient()}>
          <Browser onAdd={vi.fn()} initialPath={FOLDER} />
        </QueryClientProvider>
      );
    }

    function singleRow() {
      return screen.findByRole('button', { name: 'Add Single to your draft' });
    }

    test('loading then their rows wait for current law, then show it', async () => {
      // Given
      let releaseParameters: () => void = () => {};
      const held = new Promise<void>((resolve) => {
        releaseParameters = resolve;
      });
      stubPublicApiFetch({
        [CHILDREN_PATH]: (url) =>
          jsonResponse(childrenPage(url.searchParams.get('parent_path') ?? '')),
        [PARAMETERS_PATH]: async (url) => {
          await held;
          return jsonResponse({
            status: 'ok',
            message: null,
            result: catalogParametersResult(url.searchParams.getAll('name')),
          });
        },
      });

      // When
      renderFolder();

      // Then
      await singleRow();
      expect(screen.getByRole('status', { name: 'Loading current law' })).toBeInTheDocument();
      releaseParameters();
      expect(await within(await singleRow()).findByText('$15,000')).toBeInTheDocument();
      expect(screen.queryByRole('status', { name: 'Loading current law' })).not.toBeInTheDocument();
    });

    test('failing to load then the folder says so and try again loads them', async () => {
      // Given
      const user = userEvent.setup();
      let attempts = 0;
      fetchStub = stubPublicApiFetch({
        [CHILDREN_PATH]: (url) =>
          jsonResponse(childrenPage(url.searchParams.get('parent_path') ?? '')),
        [PARAMETERS_PATH]: (url) => {
          attempts += 1;
          return attempts === 1
            ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
            : jsonResponse({
                status: 'ok',
                message: null,
                result: catalogParametersResult(url.searchParams.getAll('name')),
              });
        },
      });
      renderFolder();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Could not load current law for these parameters'
      );

      // When
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      // Then
      expect(await within(await singleRow()).findByText('$15,000')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2);
    });
  });
});
