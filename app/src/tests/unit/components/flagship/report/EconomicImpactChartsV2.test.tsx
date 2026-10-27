import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import EconomicImpactCharts from '@/components/flagship/report/EconomicImpactCharts';
import { clearMetadata, fetchMetadataThunk, metadataRequest } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  catalogVariablesEnvelope,
  VARIABLES_PATH,
} from '@/tests/fixtures/api/publicApi/catalogVariablesMocks';
import {
  jsonResponse,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  REPORT_4332_OUTPUT,
  withUKBreakdowns,
} from '@/tests/fixtures/components/flagship/report/charts/reportChartMocks';
import { testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: vi.fn(() => 'uk') }));

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

// jsdom has no layout, so the container hands each chart a fixed size.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div style={{ width: 700, height: 260 }}>
        {React.cloneElement(children, { width: 700, height: 260 } as any)}
      </div>
    ),
  };
});

let answerVariables: () => Response | Promise<Response>;

function renderCharts() {
  return render(
    <QueryClientProvider client={testQueryClient()}>
      <EconomicImpactCharts output={withUKBreakdowns(REPORT_4332_OUTPUT)} />
    </QueryClientProvider>,
    'uk'
  );
}

describe('EconomicImpactCharts for the UK with v3 on the v2 routes', () => {
  beforeEach(async () => {
    answerVariables = () => jsonResponse(catalogVariablesEnvelope());
    stubPublicApiFetch({ [VARIABLES_PATH]: () => answerVariables() });
    store.dispatch(clearMetadata());
    await store.dispatch(fetchMetadataThunk(metadataRequest('uk', 'v2')));
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the variables still loading then the programme card waits for their names', () => {
    // Given
    answerVariables = () => new Promise<Response>(() => {});

    // When
    renderCharts();

    // Then
    const programmes = screen
      .getByRole('button', { name: 'Expand Budgetary impact by programme' })
      .closest('section');
    expect(programmes).toContainElement(
      screen.getByRole('status', { name: 'Loading programme names' })
    );
  });

  test('given the variables arrive then the programme card shows its chart', async () => {
    // When
    renderCharts();

    // Then
    await waitFor(() =>
      expect(
        screen.queryByRole('status', { name: 'Loading programme names' })
      ).not.toBeInTheDocument()
    );
    const programmes = screen
      .getByRole('button', { name: 'Expand Budgetary impact by programme' })
      .closest('section');
    expect(programmes).toHaveTextContent('Budgetary impact (£bn)');
  });

  function programmeCsvButton() {
    const programmes = screen
      .getByRole('button', { name: 'Expand Budgetary impact by programme' })
      .closest('section') as HTMLElement;
    return within(programmes).getByRole('button', { name: 'Download CSV' });
  }

  test('given the variables still loading then the programme CSV waits for their names', () => {
    // Given
    answerVariables = () => new Promise<Response>(() => {});

    // When
    renderCharts();

    // Then
    expect(programmeCsvButton()).toBeDisabled();
  });

  test('given the variables fail then the programme CSV stays unavailable', async () => {
    // Given
    answerVariables = () => jsonResponse({ status: 'error', message: 'Unavailable' }, 503);

    // When
    renderCharts();

    // Then
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(programmeCsvButton()).toBeDisabled();
  });

  test('given the variables arrive then the programme CSV can be downloaded', async () => {
    // When
    renderCharts();

    // Then
    await waitFor(() => expect(programmeCsvButton()).toBeEnabled());
  });
});
