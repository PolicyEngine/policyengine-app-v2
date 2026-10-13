import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import LocalDataImportPrompt from '@/components/auth/LocalDataImportPrompt';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { isImportDeclined } from '@/libs/auth/localImport';
import {
  errorResponse,
  mockMeItem,
  okResponse,
  PE_USER_ID,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';
import { seedManySimulations } from '@/tests/fixtures/libs/auth/localImportMocks';

const fetchMock = vi.fn();

function renderPrompt(auth: AuthContextValue, countryId = 'us') {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthTestProvider value={auth}>
        <LocalDataImportPrompt />
      </AuthTestProvider>
    </QueryClientProvider>,
    countryId
  );
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('LocalDataImportPrompt', () => {
  test('given a signed-in user with local work then the prompt offers to save it', async () => {
    // Given
    seedManySimulations(2);

    // When
    renderPrompt(signedInAuthValue());

    // Then
    expect(
      await screen.findByText('Save the work on this device to your account?')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this browser has 2 items saved on it while signed out/i)
    ).toBeInTheDocument();
  });

  test('given a signed-out visitor then nothing is offered', () => {
    // Given
    seedManySimulations(2);

    // When
    renderPrompt(makeAuthValue({ status: 'anonymous' }));

    // Then
    expect(screen.queryByText(/save the work on this device/i)).not.toBeInTheDocument();
  });

  test('given a signed-in user in Canada then nothing is offered', () => {
    // Given
    seedManySimulations(2);

    // When
    renderPrompt(signedInAuthValue(), 'ca');

    // Then
    expect(screen.queryByText(/save the work on this device/i)).not.toBeInTheDocument();
  });

  test('given "Not now" then the choice is remembered', async () => {
    // Given
    const user = userEvent.setup();
    seedManySimulations(1);
    renderPrompt(signedInAuthValue());

    // When
    await user.click(await screen.findByRole('button', { name: 'Not now' }));

    // Then
    expect(isImportDeclined(PE_USER_ID)).toBe(true);
  });

  test('given "Save to my account" then the work is imported and summarised', async () => {
    // Given
    const user = userEvent.setup();
    seedManySimulations(2);
    fetchMock.mockImplementation(async () =>
      okResponse({ id_map: { 'sus-0': 'uuid-0', 'sus-1': 'uuid-1' }, skipped: [] })
    );
    renderPrompt(signedInAuthValue());

    // When
    await user.click(await screen.findByRole('button', { name: 'Save to my account' }));

    // Then
    await waitFor(() =>
      expect(screen.getByText('Your work is saved to your account')).toBeInTheDocument()
    );
    expect(screen.getByText('Saved 2 items to your account.')).toBeInTheDocument();
    expect(screen.getByText('Nothing was removed from this device.')).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.policyengine.org/v2/me/imports?country_id=us');
    expect(init.method).toBe('POST');
    expect(mockMeItem.id).toBe(PE_USER_ID);
  });

  test('given an import with a failed request then closing does not bring the prompt back', async () => {
    // Given: the request fails, so every item is still pending afterwards
    const user = userEvent.setup();
    seedManySimulations(2);
    fetchMock.mockImplementation(async () => errorResponse(503, 'Saved work is unavailable'));
    const { unmount } = renderPrompt(signedInAuthValue());
    await user.click(await screen.findByRole('button', { name: 'Save to my account' }));
    await screen.findByText('2 items did not go through. You can try again later.');

    // When
    await user.click(screen.getByRole('button', { name: 'Done' }));
    unmount();
    renderPrompt(signedInAuthValue());

    // Then
    expect(isImportDeclined(PE_USER_ID)).toBe(true);
    expect(screen.queryByText(/save the work on this device/i)).not.toBeInTheDocument();
  });

  test('given a finished import then "Done" is remembered too', async () => {
    // Given
    const user = userEvent.setup();
    seedManySimulations(2);
    fetchMock.mockImplementation(async () =>
      okResponse({
        id_map: { 'sus-0': 'uuid-0' },
        skipped: [{ client_ref: null, reason: 'invalid' }],
      })
    );
    renderPrompt(signedInAuthValue());
    await user.click(await screen.findByRole('button', { name: 'Save to my account' }));

    // When
    await user.click(await screen.findByRole('button', { name: 'Done' }));

    // Then
    expect(isImportDeclined(PE_USER_ID)).toBe(true);
  });
});
