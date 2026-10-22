import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderWithCountry, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BASE_URL } from '@/constants';
import { PolicyCreationModal } from '@/pages/reportBuilder/modals/PolicyCreationModal';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  CANDIDATE_METADATA,
  CANONICAL_RATE,
  DISPLAY_PERCENT,
  EXPECTED_PAYLOAD,
  HIDDEN_SENTINELS,
  MAIN_RATE_LABEL,
  POLICY_LABEL,
  PRIOR_ACTUAL_PERSISTENCE_PAYLOAD,
  REPORT_YEAR,
  SEARCH_CASES,
} from '@/tests/fixtures/pages/reportBuilder/PolicyCreationModalParameterVisibilityMocks';

const COMPONENT_TEST_TIMEOUT = 20_000;
let client: QueryClient;
let calls: Array<{ url: string; method: string; body: { data: unknown } | null }>;
function evidence(name: string, value: unknown) {
  const directory = process.env.POLICYENGINE_TEST_EVIDENCE_DIR;
  if (directory) {
    writeFileSync(
      join(directory, name),
      typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`
    );
  }
}
function mount() {
  const created = vi.fn();
  const closed = vi.fn();
  renderWithCountry(
    <QueryClientProvider client={client}>
      <PolicyCreationModal
        isOpen
        onClose={closed}
        onPolicyCreated={created}
        reportYear={REPORT_YEAR}
        simulationIndex={1}
      />
    </QueryClientProvider>,
    'uk',
    '/uk/reports/create',
    'calculator'
  );
  return { created, closed };
}
function options() {
  return screen.queryAllByRole('option').map((option) => option.getAttribute('data-value'));
}
beforeEach(() => {
  calls = [];
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  localStorage.clear();
  act(() => {
    store.dispatch(fetchMetadataThunk.pending('candidate2490-metadata', 'uk'));
    store.dispatch(
      fetchMetadataThunk.fulfilled(
        { data: structuredClone(CANDIDATE_METADATA), country: 'uk' },
        'candidate2490-metadata',
        'uk'
      )
    );
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const request = {
        url: String(url),
        method: init?.method || 'GET',
        body: init?.body ? JSON.parse(String(init.body)) : null,
      };
      calls.push(request);
      evidence('final-API-boundary-calls.json', calls);
      if (request.method !== 'POST' || request.url !== `${BASE_URL}/uk/policy`) {
        throw new Error(`Unexpected API boundary: ${JSON.stringify(request)}`);
      }
      return {
        ok: true,
        status: 201,
        json: async () => ({ status: 'ok', result: { policy_id: 'component-boundary-only-2' } }),
      } as Response;
    })
  );
});
afterEach((context) => {
  evidence(
    `${context.task.name.replace(/[^a-z0-9]+/gi, '-').slice(0, 150)}.html`,
    document.body.innerHTML
  );
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});

describe('genuine policy component parameter visibility', () => {
  test.each(SEARCH_CASES)(
    'given $term with a hidden compatibility alias when searching then only its canonical option appears',
    async ({ term, canonical }) => {
      mount();
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Search parameters...'), term);
      await waitFor(() => expect(screen.queryAllByRole('option').length).toBeGreaterThan(0));
      evidence(
        canonical === CANONICAL_RATE ? 'main-search-options.json' : 'secondary-search-options.json',
        options()
      );
      expect(options()).toEqual([canonical]);
    },
    COMPONENT_TEST_TIMEOUT
  );

  test(
    'given hidden fixed-zero sentinels when searching their label then they are absent',
    async () => {
      mount();
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Search parameters...'), 'threshold');
      await waitFor(() => expect(screen.queryAllByRole('option').length).toBeGreaterThan(0));
      evidence('sentinel-search-options.json', options());
      for (const hidden of HIDDEN_SENTINELS) {
        expect.soft(options()).not.toContain(hidden);
      }
    },
    COMPONENT_TEST_TIMEOUT
  );

  test(
    'given canonical selection when entering10percent for2026 and naming then the genuine API adapter submits canonical0.1',
    async () => {
      const { created, closed } = mount();
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Search parameters...'), MAIN_RATE_LABEL);
      await waitFor(() => expect(screen.queryAllByRole('option').length).toBeGreaterThan(0));
      const canonical = screen
        .getAllByRole('option')
        .find((option) => option.getAttribute('data-value') === CANONICAL_RATE);
      expect(canonical).toBeDefined();
      await user.click(canonical!);
      await user.click(screen.getByRole('tab', { name: 'Yearly' }));
      const value = screen.getByPlaceholderText('Enter value');
      await user.click(value);
      await user.keyboard('{Control>}a{/Control}10');
      expect(value).toHaveValue(DISPLAY_PERCENT);
      evidence('canonical-setter10percent.html', document.body.innerHTML);
      await user.click(screen.getByRole('button', { name: 'Add change' }));
      await user.click(screen.getByText('Click to name your policy...', { exact: true }));
      await user.type(screen.getByPlaceholderText('Enter policy name...'), POLICY_LABEL);
      await user.keyboard('{Enter}');
      expect(screen.queryByPlaceholderText('Enter policy name...')).not.toBeInTheDocument();
      expect(screen.getAllByText(POLICY_LABEL, { exact: true }).length).toBeGreaterThan(0);
      evidence('name-committed.html', document.body.innerHTML);
      await user.click(screen.getByRole('button', { name: 'Create policy' }));
      await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
      expect(closed).toHaveBeenCalledTimes(1);
      evidence('submission-payload.json', {
        calls,
        expected: EXPECTED_PAYLOAD,
        priorActualPersistence: PRIOR_ACTUAL_PERSISTENCE_PAYLOAD,
        created: created.mock.calls,
        closedCount: closed.mock.calls.length,
        qualification:
          'Only final fetch201 boundary mocked; actual selectors/providers/components/setter/hooks/adapter execute. Prior real HTTP persistence remains separate.',
      });
      expect(calls).toHaveLength(1);
      expect(calls[0].body?.data).toEqual(EXPECTED_PAYLOAD);
      expect(calls[0].body?.data).toEqual(PRIOR_ACTUAL_PERSISTENCE_PAYLOAD);
      expect(created.mock.calls[0][0].label).toBe(POLICY_LABEL);
    },
    COMPONENT_TEST_TIMEOUT
  );
});
