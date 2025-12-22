import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import metadataReducer from '@/reducers/metadataReducer';
import { policyEngineTheme } from '@/theme';
import {
  TEST_COUNTRIES,
  PARAMETERS_STATE,
  LOADING_MESSAGES,
  CHILD_CONTENT,
} from '@/tests/fixtures/routing/guards/guardsMocks';

// Track current mock state
let mockParametersState = PARAMETERS_STATE.INITIAL;

// Mock the hooks
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => TEST_COUNTRIES.US,
}));

vi.mock('@/hooks/useParameters', () => ({
  useFetchParameters: vi.fn(),
  selectParametersState: () => mockParametersState,
}));

// Mock react-redux
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useSelector: (selector: () => unknown) => selector(),
  };
});

// Mock pages
vi.mock('@/pages/report-output/ErrorPage', () => ({
  default: ({ error }: { error: string }) => <div data-testid="error-page">{error}</div>,
}));

vi.mock('@/pages/report-output/LoadingPage', () => ({
  default: ({ message }: { message: string }) => <div data-testid="loading-page">{message}</div>,
}));

// Import after mocks
import { ParametersGuard } from '@/routing/guards/ParametersGuard';

// Create a fresh store for each test
function createTestStore() {
  return configureStore({
    reducer: {
      metadata: metadataReducer,
    },
  });
}

// Test wrapper with router
function renderWithRouter() {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/test']}>
        <MantineProvider theme={policyEngineTheme}>
          <Routes>
            <Route element={<ParametersGuard />}>
              <Route path="test" element={<div data-testid="child-content">{CHILD_CONTENT}</div>} />
            </Route>
          </Routes>
        </MantineProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('ParametersGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParametersState = PARAMETERS_STATE.INITIAL;
  });

  describe('loading state', () => {
    it('given parametersLoading is true then renders loading page', () => {
      // Given
      mockParametersState = PARAMETERS_STATE.LOADING;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('loading-page')).toBeInTheDocument();
      expect(screen.getByText(LOADING_MESSAGES.PARAMETERS)).toBeInTheDocument();
    });

    it('given parametersLoaded is false then renders loading page', () => {
      // Given
      mockParametersState = PARAMETERS_STATE.INITIAL;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('given parametersError is set then renders error page', () => {
      // Given
      mockParametersState = PARAMETERS_STATE.ERROR;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('error-page')).toBeInTheDocument();
      expect(screen.getByText(PARAMETERS_STATE.ERROR.parametersError)).toBeInTheDocument();
    });
  });

  describe('loaded state', () => {
    it('given parametersLoaded is true then renders child routes', () => {
      // Given
      mockParametersState = PARAMETERS_STATE.LOADED;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText(CHILD_CONTENT)).toBeInTheDocument();
    });

    it('given parametersLoaded is true then does not render loading page', () => {
      // Given
      mockParametersState = PARAMETERS_STATE.LOADED;

      // When
      renderWithRouter();

      // Then
      expect(screen.queryByTestId('loading-page')).not.toBeInTheDocument();
    });

    it('given parametersLoaded is true then does not render error page', () => {
      // Given
      mockParametersState = PARAMETERS_STATE.LOADED;

      // When
      renderWithRouter();

      // Then
      expect(screen.queryByTestId('error-page')).not.toBeInTheDocument();
    });
  });
});
