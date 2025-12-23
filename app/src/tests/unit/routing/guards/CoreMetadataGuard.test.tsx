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
  METADATA_STATE,
  LOADING_MESSAGES,
  CHILD_CONTENT,
} from '@/tests/fixtures/routing/guards/guardsMocks';

// Track current mock state - type to allow reassignment to different states
let mockMetadataState: {
  loading: boolean;
  loaded: boolean;
  error: string | null;
  currentCountry: string | null;
} = METADATA_STATE.INITIAL;

// Mock the hooks
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => TEST_COUNTRIES.US,
}));

vi.mock('@/hooks/useCoreMetadata', () => ({
  useFetchCoreMetadata: vi.fn(),
  selectCoreMetadataState: () => mockMetadataState,
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
    mockMetadataState = METADATA_STATE.INITIAL;
  });

  describe('loading state', () => {
    it('given loading is true then renders loading page', () => {
      // Given
      mockMetadataState = METADATA_STATE.LOADING;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('loading-page')).toBeInTheDocument();
      expect(screen.getByText(LOADING_MESSAGES.METADATA)).toBeInTheDocument();
    });

    it('given loaded is false then renders loading page', () => {
      // Given
      mockMetadataState = METADATA_STATE.INITIAL;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('loading-page')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('given error is set then renders error page', () => {
      // Given
      mockMetadataState = METADATA_STATE.ERROR;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('error-page')).toBeInTheDocument();
      expect(screen.getByText(METADATA_STATE.ERROR.error)).toBeInTheDocument();
    });
  });

  describe('loaded state', () => {
    it('given loaded is true then renders child routes', () => {
      // Given
      mockMetadataState = METADATA_STATE.LOADED;

      // When
      renderWithRouter();

      // Then
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText(CHILD_CONTENT)).toBeInTheDocument();
    });

    it('given loaded is true then does not render loading page', () => {
      // Given
      mockMetadataState = METADATA_STATE.LOADED;

      // When
      renderWithRouter();

      // Then
      expect(screen.queryByTestId('loading-page')).not.toBeInTheDocument();
    });

    it('given loaded is true then does not render error page', () => {
      // Given
      mockMetadataState = METADATA_STATE.LOADED;

      // When
      renderWithRouter();

      // Then
      expect(screen.queryByTestId('error-page')).not.toBeInTheDocument();
    });
  });
});
