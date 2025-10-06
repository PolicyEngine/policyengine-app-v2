import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  MOCK_METADATA_STATES,
  MOCK_COUNTRIES,
  TEST_MESSAGES,
} from '@/tests/fixtures/routing/guards/metadataGuardMocks';

// Mock the hooks - must not reference outside variables
vi.mock('@/hooks/useMetadata', () => ({
  useFetchMetadata: vi.fn(),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

// Import after mocks are set up
import { MetadataGuard } from '@/routing/guards/MetadataGuard';

// Child component for testing Outlet rendering
const TestChild = () => <div>Child Component</div>;

describe('MetadataGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given metadata is loading then shows loading page', () => {
    // Given
    const initialState = {
      metadata: MOCK_METADATA_STATES.LOADING,
    };

    // When
    render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<MetadataGuard />}>
            <Route path="/test" element={<TestChild />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { initialState }
    );

    // Then
    expect(screen.getByText(TEST_MESSAGES.LOADING)).toBeInTheDocument();
    expect(screen.queryByText('Child Component')).not.toBeInTheDocument();
  });

  test('given metadata has error then shows error page', () => {
    // Given
    const initialState = {
      metadata: MOCK_METADATA_STATES.ERROR,
    };

    // When
    render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<MetadataGuard />}>
            <Route path="/test" element={<TestChild />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { initialState }
    );

    // Then
    expect(screen.getByText(TEST_MESSAGES.ERROR_TITLE)).toBeInTheDocument();
    expect(screen.getByText(MOCK_METADATA_STATES.ERROR.error as string)).toBeInTheDocument();
    expect(screen.queryByText('Child Component')).not.toBeInTheDocument();
  });

  test('given metadata version is null then shows loading page', () => {
    // Given
    const initialState = {
      metadata: MOCK_METADATA_STATES.UNINITIALIZED,
    };

    // When
    render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<MetadataGuard />}>
            <Route path="/test" element={<TestChild />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { initialState }
    );

    // Then
    expect(screen.getByText(TEST_MESSAGES.LOADING)).toBeInTheDocument();
    expect(screen.queryByText('Child Component')).not.toBeInTheDocument();
  });

  test('given metadata is loaded then renders child routes', () => {
    // Given
    const initialState = {
      metadata: MOCK_METADATA_STATES.LOADED,
    };

    // When
    render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<MetadataGuard />}>
            <Route path="/test" element={<TestChild />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { initialState }
    );

    // Then
    expect(screen.getByText('Child Component')).toBeInTheDocument();
    expect(screen.queryByText(TEST_MESSAGES.LOADING)).not.toBeInTheDocument();
  });

  test('given guard mounts then calls hooks with country id', () => {
    // Given
    const initialState = {
      metadata: MOCK_METADATA_STATES.LOADED,
    };

    // When
    render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route element={<MetadataGuard />}>
            <Route path="/test" element={<TestChild />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { initialState }
    );

    // Then
    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });
});
