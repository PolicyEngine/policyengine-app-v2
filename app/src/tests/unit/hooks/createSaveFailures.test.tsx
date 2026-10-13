import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createHousehold } from '@/api/household';
import { createPolicy } from '@/api/policy';
import { createSimulation } from '@/api/simulation';
import SaveFailureNotice from '@/components/common/SaveFailureNotice';
import { CountryProvider } from '@/contexts/CountryContext';
import { useCreateHousehold } from '@/hooks/useCreateHousehold';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { ACCOUNT_UNAVAILABLE_MESSAGE } from '@/libs/auth/useAssociationBackend';
import { dismissSaveFailure } from '@/libs/saveFailureNotice';
import { store } from '@/store';
import { errorResponse } from '@/tests/fixtures/api/v2UserMocks';
import { mockHouseholdCreationPayload } from '@/tests/fixtures/hooks/hooksMocks';
import {
  accountErrorAuthValue,
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';
import type { PolicyCreationPayload, SimulationCreationPayload } from '@/types/payloads';

/**
 * Creating a policy, household or simulation creates the v1 artifact and
 * then adds it to the user's saved work. When that second step fails the
 * builder still gets the artifact, and the user is told it was not saved.
 */

vi.mock('@/api/policy', () => ({ createPolicy: vi.fn() }));
vi.mock('@/api/household', () => ({ createHousehold: vi.fn() }));
vi.mock('@/api/simulation', () => ({ createSimulation: vi.fn() }));

const POLICY_RESPONSE = { result: { policy_id: '95762' } };
const HOUSEHOLD_RESPONSE = { result: { household_id: '123' } };
const SIMULATION_RESPONSE = { result: { simulation_id: '613' } };

const POLICY_PAYLOAD: PolicyCreationPayload = { data: {} };
const SIMULATION_PAYLOAD: SimulationCreationPayload = {
  population_id: 'us',
  population_type: 'geography',
  policy_id: 95762,
};

const fetchMock = vi.fn();

function renderWithSession<Result>(useHook: () => Result, auth: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <CountryProvider value="us">
          <AuthTestProvider value={auth}>{children}</AuthTestProvider>
        </CountryProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
  render(<SaveFailureNotice />);
  return renderHook(useHook, { wrapper });
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(createPolicy).mockResolvedValue(POLICY_RESPONSE);
  vi.mocked(createHousehold).mockResolvedValue(HOUSEHOLD_RESPONSE);
  vi.mocked(createSimulation).mockResolvedValue(SIMULATION_RESPONSE);
});

afterEach(() => {
  act(() => dismissSaveFailure());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('creating while saved work cannot be saved', () => {
  test('given the account is unavailable then a new policy is still returned and the user is told', async () => {
    // Given
    const { result } = renderWithSession(
      () => useCreatePolicy('CTC expansion'),
      accountErrorAuthValue()
    );

    // When
    const created = await act(() => result.current.createPolicy(POLICY_PAYLOAD));

    // Then
    expect(created).toEqual(POLICY_RESPONSE);
    expect(screen.getByRole('alert')).toHaveTextContent(
      `Your policy was created, but it could not be added to your saved work. ${ACCOUNT_UNAVAILABLE_MESSAGE}`
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given the account rejects a too-large save then a new household is still returned and the user is told', async () => {
    // Given
    fetchMock.mockResolvedValue(errorResponse(413, 'Request body is too large.'));
    const { result } = renderWithSession(() => useCreateHousehold('Family'), signedInAuthValue());

    // When
    const created = await act(() => result.current.createHousehold(mockHouseholdCreationPayload));

    // Then
    expect(created).toEqual(HOUSEHOLD_RESPONSE);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your household was created, but it could not be added to your saved work. Request body is too large.'
    );
  });

  test('given saved work is down then a new simulation is still returned and the user is told', async () => {
    // Given
    fetchMock.mockResolvedValue(new Response('', { status: 503 }));
    const { result } = renderWithSession(
      () => useCreateSimulation('Baseline'),
      signedInAuthValue()
    );

    // When
    const created = await act(() => result.current.createSimulation(SIMULATION_PAYLOAD));

    // Then
    expect(created).toEqual(SIMULATION_RESPONSE);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your simulation was created, but it could not be added to your saved work. Saved work is temporarily unavailable.'
    );
  });

  test('given a successful save then nothing is shown', async () => {
    // Given
    const { result } = renderWithSession(
      () => useCreatePolicy('CTC expansion'),
      makeAuthValue({ status: 'anonymous' })
    );

    // When
    await act(() => result.current.createPolicy(POLICY_PAYLOAD));

    // Then
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given the notice is closed then it goes away', async () => {
    // Given
    const { result } = renderWithSession(() => useCreatePolicy(), accountErrorAuthValue());
    await act(() => result.current.createPolicy(POLICY_PAYLOAD));

    // When
    act(() => screen.getByRole('button', { name: 'Close' }).click());

    // Then
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
