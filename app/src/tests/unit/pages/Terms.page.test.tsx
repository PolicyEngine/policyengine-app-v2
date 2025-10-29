import { render, screen } from '@test-utils';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import * as ReactRouter from 'react-router-dom';
import TermsPage from '@/pages/Terms.page';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouter>('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

const renderWithCountry = (countryId: string = 'us') => {
  vi.mocked(ReactRouter.useParams).mockReturnValue({ countryId });
  return render(<TermsPage />);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TermsPage', () => {
  test('given US country then mentions United States in governing law', () => {
    // Given / When
    renderWithCountry('us');

    // Then
    expect(screen.getByText(/the laws of the united states/i)).toBeInTheDocument();
  });

  test('given UK country then mentions United Kingdom in governing law', () => {
    // Given / When
    renderWithCountry('uk');

    // Then
    expect(screen.getByText(/the laws of the united kingdom/i)).toBeInTheDocument();
  });

  test('given page loads then component renders without error', () => {
    // Given / When
    const { container } = renderWithCountry();

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });
});
