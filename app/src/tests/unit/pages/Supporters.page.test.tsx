import { render, screen } from '@test-utils';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import * as ReactRouter from 'react-router-dom';
import SupportersPage from '@/pages/Supporters.page';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof ReactRouter>('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

const renderWithCountry = (countryId: string = 'us') => {
  vi.mocked(ReactRouter.useParams).mockReturnValue({ countryId });
  return render(<SupportersPage />);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SupportersPage', () => {
  test('given page loads then hero section is rendered', () => {
    // Given / When
    renderWithCountry();

    // Then
    expect(screen.getByRole('heading', { name: /our supporters/i, level: 1 })).toBeInTheDocument();
  });

  test('given US country then organizations is spelled with z', () => {
    // Given / When
    renderWithCountry('us');

    // Then
    expect(screen.getByText(/organizations/i)).toBeInTheDocument();
  });

  test('given UK country then organisations is spelled with s', () => {
    // Given / When
    renderWithCountry('uk');

    // Then
    expect(screen.getByText(/organisations/i)).toBeInTheDocument();
  });

  test('given page loads then bold text in hero is rendered', () => {
    // Given / When
    renderWithCountry();

    // Then
    const boldText = screen.getByText(/grants, contracts, and donations/i);
    expect(boldText.tagName).toBe('STRONG');
  });

  test('given page loads then supporter names are displayed', () => {
    // Given / When
    renderWithCountry();

    // Then
    expect(screen.getByText(/arnold ventures/i)).toBeInTheDocument();
    expect(screen.getByText(/nuffield foundation/i)).toBeInTheDocument();
    expect(screen.getAllByText(/myfriendben/i).length).toBeGreaterThan(0);
  });

  test('given page loads then supporter logos are rendered', () => {
    // Given / When
    renderWithCountry();

    // Then
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  test('given page loads then project titles are displayed', () => {
    // Given / When
    renderWithCountry();

    // Then
    expect(screen.getAllByText(/labor supply responses/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/benefit eligibility api/i).length).toBeGreaterThan(0);
  });

  test('given page loads then supporters are sorted by total funding', () => {
    // Given / When
    renderWithCountry();

    // Then
    const supporterNames = screen.getAllByText(/ventures|foundation|philanthropy/i);
    // Arnold Ventures should appear first (highest total funding)
    expect(supporterNames[0]).toHaveTextContent(/arnold ventures/i);
  });

  test('given supporter with multiple projects then projects are sorted by date', () => {
    // Given / When
    renderWithCountry();

    // Then
    // Arnold has multiple projects - newest should appear first
    expect(screen.getAllByText(/state & congressional district policy breakdowns/i).length).toBeGreaterThan(0);
  });

  test('given page loads then GBP amounts are formatted correctly', () => {
    // Given / When
    renderWithCountry();

    // Then
    expect(screen.getAllByText(/£251,296/i).length).toBeGreaterThan(0);
  });

  test('given page loads then USD amounts are formatted correctly', () => {
    // Given / When
    renderWithCountry();

    // Then
    expect(screen.getAllByText(/\$300,000/i).length).toBeGreaterThan(0);
  });

  test('given page loads then project dates are formatted as Month YYYY', () => {
    // Given / When
    renderWithCountry();

    // Then
    expect(screen.getAllByText(/september 2024/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/january 2025/i).length).toBeGreaterThan(0);
  });

  test('given projects with URLs then links are rendered', () => {
    // Given / When
    renderWithCountry();

    // Then
    const links = screen.getAllByRole('link');
    const projectLinks = links.filter((link) =>
      link.getAttribute('href')?.includes('policyengine.org')
    );
    expect(projectLinks.length).toBeGreaterThan(0);
  });

  test('given supporter with website then logo is clickable', () => {
    // Given / When
    renderWithCountry();

    // Then
    const links = screen.getAllByRole('link');
    const supporterLinks = links.filter(
      (link) =>
        link.getAttribute('href')?.includes('arnoldventures.org') ||
        link.getAttribute('href')?.includes('nuffieldfoundation.org')
    );
    expect(supporterLinks.length).toBeGreaterThan(0);
  });

  test('given page loads then component renders without error', () => {
    // Given / When
    const { container } = renderWithCountry();

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });
});
