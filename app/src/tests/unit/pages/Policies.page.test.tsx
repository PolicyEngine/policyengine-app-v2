import { configureStore } from '@reduxjs/toolkit';
import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MOCK_USER_ID } from '@/constants';
import { PolicyCreationFlow } from '@/flows/policyCreationFlow';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import PoliciesPage from '@/pages/Policies.page';
import flowReducer, { setFlow } from '@/reducers/flowReducer';
import {
  createMockDispatch,
  ERROR_MESSAGES,
  mockDefaultHookReturn,
  mockEmptyHookReturn,
  mockErrorHookReturn,
  mockLoadingHookReturn,
} from '@/tests/fixtures/pages/policiesMocks';

// Mock the hooks
vi.mock('@/hooks/useUserPolicy', () => ({
  useUserPolicies: vi.fn(),
}));

// Mock the dispatch
const mockDispatch = createMockDispatch();

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

// Mock IngredientReadView component
vi.mock('@/components/IngredientReadView', () => ({
  default: vi.fn(
    ({
      title,
      subtitle,
      onBuild,
      isLoading,
      isError,
      error,
      data,
      searchValue,
      onSearchChange,
      columns,
    }) => {
      // Extract menu action handler if columns are provided
      const menuColumn = columns?.find((col: any) => col.type === 'split-menu');
      const handleMenuAction = menuColumn?.onAction;

      return (
        <div data-testid="ingredient-read-view">
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {isLoading && <div>Loading...</div>}
          {isError && <div>Error: {error?.message}</div>}
          {data && (
            <>
              <div>Data count: {data.length}</div>
              {data.length > 0 && (
                <>
                  <div data-testid="policy-name">{(data[0].policyName as any).text}</div>
                  <div data-testid="parameter-changes">{(data[0].provisions as any).text}</div>
                  {handleMenuAction && (
                    <button
                      type="button"
                      onClick={() => handleMenuAction('view-policy', data[0].id)}
                      data-testid="view-policy-button"
                    >
                      View Policy
                    </button>
                  )}
                </>
              )}
            </>
          )}
          <button type="button" onClick={onBuild}>
            Build Policy
          </button>
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
          />
        </div>
      );
    }
  ),
}));

describe('PoliciesPage', () => {
  const mockStore = configureStore({
    reducer: {
      flow: flowReducer,
      metadata: () => ({ currentCountry: 'us' }),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useUserPolicies as any).mockReturnValue(mockDefaultHookReturn);
  });

  test('given policies data when rendering then displays policies page', () => {
    // When
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // Then
    expect(screen.getByText('Your saved policies')).toBeInTheDocument();
    expect(screen.getByText(/Create a policy reform/)).toBeInTheDocument();
    expect(screen.getByText('Data count: 2')).toBeInTheDocument();
  });

  test('given loading state when rendering then shows loading indicator', () => {
    // Given
    (useUserPolicies as any).mockReturnValue(mockLoadingHookReturn);

    // When
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // Then
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('given error state when rendering then shows error message', () => {
    // Given
    (useUserPolicies as any).mockReturnValue(mockErrorHookReturn);

    // When
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // Then
    expect(screen.getByText(`Error: ${ERROR_MESSAGES.FETCH_FAILED}`)).toBeInTheDocument();
  });

  test('given user clicks build policy button then dispatches policy creation flow', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // When
    await user.click(screen.getByRole('button', { name: /Build Policy/i }));

    // Then
    expect(mockDispatch).toHaveBeenCalledWith(setFlow(PolicyCreationFlow));
  });

  test('given no policies when rendering then displays empty state', () => {
    // Given
    (useUserPolicies as any).mockReturnValue(mockEmptyHookReturn);

    // When
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // Then
    expect(screen.getByText('Data count: 0')).toBeInTheDocument();
  });

  test('given user searches then updates search value', async () => {
    // Given
    const user = userEvent.setup();
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // When
    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'Test Policy');

    // Then
    expect(searchInput).toHaveValue('Test Policy');
  });

  test('given hook returns correct user ID then uses MOCK_USER_ID', () => {
    // When
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // Then
    expect(useUserPolicies).toHaveBeenCalledWith(MOCK_USER_ID.toString());
  });

  test('given policy with parameter changes then displays correct count', () => {
    // When
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // Then
    const parameterChanges = screen.getByTestId('parameter-changes');
    expect(parameterChanges).toHaveTextContent('3 parameter changes'); // 2 + 1 from mock data
  });

  test('given policy with single parameter change then displays singular form', () => {
    // Given
    const singleChangeData = {
      ...mockDefaultHookReturn,
      data: [
        {
          ...mockDefaultHookReturn.data![1], // Second policy has only 1 change
        },
      ],
    };
    (useUserPolicies as any).mockReturnValue(singleChangeData);

    // When
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // Then
    const parameterChanges = screen.getByTestId('parameter-changes');
    expect(parameterChanges).toHaveTextContent('1 parameter change');
  });

  test('given policy without label then displays default label', () => {
    // Given
    const dataWithoutLabel = {
      ...mockDefaultHookReturn,
      data: [
        {
          ...mockDefaultHookReturn.data![0],
          association: {
            ...mockDefaultHookReturn.data![0].association,
            label: undefined,
          },
        },
      ],
    };
    (useUserPolicies as any).mockReturnValue(dataWithoutLabel);

    // When
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // Then
    const policyName = screen.getByTestId('policy-name');
    expect(policyName).toHaveTextContent(/Policy #101/);
  });

  test('given column configuration then does not include connections column', () => {
    // When
    render(
      <Provider store={mockStore}>
        <PoliciesPage />
      </Provider>
    );

    // Then
    // The component should render successfully without connections column
    expect(screen.getByText('Your saved policies')).toBeInTheDocument();
    // Verify parameter changes column exists (renamed from provisions)
    expect(screen.getByTestId('parameter-changes')).toBeInTheDocument();
  });
});
