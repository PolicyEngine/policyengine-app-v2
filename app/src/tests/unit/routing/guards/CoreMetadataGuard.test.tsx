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
  CORE_STATE,
  LOADING_MESSAGES,
  CHILD_CONTENT,
} from '@/tests/fixtures/routing/guards/guardsMocks';

// Track current mock state
let mockCoreState = CORE_STATE.INITIAL;

// Mock the hooks
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => TEST_COUNTRIES.US,
}));

vi.mock('@/hooks/useCoreMetadata', () => ({
  useFetchCoreMetadata: vi.fn(),
  selectCoreMetadataState: () => mockCoreState,
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
import { CoreMetadataGuard } from '@/routing/guards/CoreMetadataGuard';

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
            <Route element={<CoreMetadataGuard />}>
              <Route path="test" element={<div data-testid="child-content">{CHILD_CONTENT}</div>} />
            </Route>
          </Routes>
        </MantineProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('CoreMetadataGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCoreState = CORE_STATE.INITIAL;
  });

  describe('loading state', () => {
    it('given coreLoading is true then renders loading page', () => {
      // Given
      mockCoreState = CORE_STATE.LOADING;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('loading-page')).toBeInTheDocument();
      expect(screen.getByText(LOADING_MESSAGES.CORE)).toBeInTheDocument();
    });

    it('given coreLoaded is false then renders loading page', () => {
      // Given
      mockCoreState = CORE_STATE.INITIAL;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('given coreError is set then renders error page', () => {
      // Given
      mockCoreState = CORE_STATE.ERROR;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('error-page')).toBeInTheDocument();
      expect(screen.getByText(CORE_STATE.ERROR.coreError)).toBeInTheDocument();
    });
  });

  describe('loaded state', () => {
    it('given coreLoaded is true then renders child routes', () => {
      // Given
      mockCoreState = CORE_STATE.LOADED;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText(CHILD_CONTENT)).toBeInTheDocument();
    });

    it('given coreLoaded is true then does not render loading page', () => {
      // Given
      mockCoreState = CORE_STATE.LOADED;

      // When
      renderWithRouter();

      // Then
      expect(screen.queryByTestId('loading-page')).not.toBeInTheDocument();
    });

    it('given coreLoaded is true then does not render error page', () => {
      // Given
      mockCoreState = CORE_STATE.LOADED;

      // When
      renderWithRouter();

      // Then
      expect(screen.queryByTestId('error-page')).not.toBeInTheDocument();
    });
  });
});
