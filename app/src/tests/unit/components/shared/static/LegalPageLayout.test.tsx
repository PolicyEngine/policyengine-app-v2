import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import LegalPageLayout from '@/components/shared/static/LegalPageLayout';
import {
  TEST_LEGAL_SECTION_MULTIPLE_PARAGRAPHS,
  TEST_LEGAL_SECTION_SIMPLE,
  TEST_LEGAL_SECTION_WITH_BOLD,
  TEST_LEGAL_SECTION_WITH_LINK,
  TEST_LEGAL_SECTIONS,
  TEST_LEGAL_TITLE,
} from '@/tests/fixtures/components/shared/static/LegalPageLayoutMocks';

describe('LegalPageLayout', () => {
  test('given title then title is rendered', () => {
    // Given / When
    render(<LegalPageLayout title={TEST_LEGAL_TITLE} sections={[]} />);

    // Then
    expect(screen.getByRole('heading', { name: TEST_LEGAL_TITLE, level: 1 })).toBeInTheDocument();
  });

  test('given sections then all section headings are rendered', () => {
    // Given / When
    render(<LegalPageLayout title={TEST_LEGAL_TITLE} sections={TEST_LEGAL_SECTIONS} />);

    // Then
    TEST_LEGAL_SECTIONS.forEach((section) => {
      expect(screen.getByRole('heading', { name: section.heading, level: 2 })).toBeInTheDocument();
    });
  });

  test('given simple section then content is rendered', () => {
    // Given / When
    render(<LegalPageLayout title={TEST_LEGAL_TITLE} sections={[TEST_LEGAL_SECTION_SIMPLE]} />);

    // Then
    expect(screen.getByText('This is a simple section with plain text.')).toBeInTheDocument();
  });

  test('given section with bold text then bold text is rendered', () => {
    // Given / When
    render(<LegalPageLayout title={TEST_LEGAL_TITLE} sections={[TEST_LEGAL_SECTION_WITH_BOLD]} />);

    // Then
    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('strong text')).toBeInTheDocument();
  });

  test('given section with link then link is rendered with correct attributes', () => {
    // Given / When
    render(<LegalPageLayout title={TEST_LEGAL_TITLE} sections={[TEST_LEGAL_SECTION_WITH_LINK]} />);

    // Then
    const link = screen.getByRole('link', { name: /link to example/i });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('given section with multiple paragraphs then all paragraphs are rendered', () => {
    // Given / When
    render(
      <LegalPageLayout
        title={TEST_LEGAL_TITLE}
        sections={[TEST_LEGAL_SECTION_MULTIPLE_PARAGRAPHS]}
      />
    );

    // Then
    expect(screen.getByText('First paragraph with some text.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph with more text.')).toBeInTheDocument();
    expect(screen.getByText('Third paragraph with final text.')).toBeInTheDocument();
  });

  test('given empty sections array then only title is rendered', () => {
    // Given / When
    render(<LegalPageLayout title={TEST_LEGAL_TITLE} sections={[]} />);

    // Then
    expect(screen.getByRole('heading', { name: TEST_LEGAL_TITLE, level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  test('given multiple sections then sections are rendered in order', () => {
    // Given / When
    render(<LegalPageLayout title={TEST_LEGAL_TITLE} sections={TEST_LEGAL_SECTIONS} />);

    // Then
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings[0]).toHaveTextContent('Simple Section');
    expect(headings[1]).toHaveTextContent('Section with Bold');
    expect(headings[2]).toHaveTextContent('Section with Link');
  });

  test('given legal page layout then component renders without error', () => {
    // Given / When
    const { container } = render(
      <LegalPageLayout title={TEST_LEGAL_TITLE} sections={TEST_LEGAL_SECTIONS} />
    );

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });
});
