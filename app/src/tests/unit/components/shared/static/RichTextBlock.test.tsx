import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import RichTextBlock from '@/components/shared/static/RichTextBlock';
import {
  TEST_BOLD_TEXT,
  TEST_FIRST_PARAGRAPH,
  TEST_LINK_HREF,
  TEST_LINK_TEXT,
  TEST_PARAGRAPH_TEXT,
  TEST_SECOND_PARAGRAPH,
} from '@/tests/fixtures/components/shared/static/RichTextBlockMocks';

describe('RichTextBlock', () => {
  test('given text content then content is rendered', () => {
    // Given / When
    render(
      <RichTextBlock>
        <p>{TEST_PARAGRAPH_TEXT}</p>
      </RichTextBlock>
    );

    // Then
    expect(screen.getByText(TEST_PARAGRAPH_TEXT)).toBeInTheDocument();
  });

  test('given link then link is rendered', () => {
    // Given / When
    render(
      <RichTextBlock>
        <p>
          Text with <a href={TEST_LINK_HREF}>{TEST_LINK_TEXT}</a>
        </p>
      </RichTextBlock>
    );

    // Then
    const link = screen.getByRole('link', { name: TEST_LINK_TEXT });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', TEST_LINK_HREF);
  });

  test('given multiple paragraphs then all are rendered', () => {
    // Given / When
    render(
      <RichTextBlock>
        <p>{TEST_FIRST_PARAGRAPH}</p>
        <p>{TEST_SECOND_PARAGRAPH}</p>
      </RichTextBlock>
    );

    // Then
    expect(screen.getByText(TEST_FIRST_PARAGRAPH)).toBeInTheDocument();
    expect(screen.getByText(TEST_SECOND_PARAGRAPH)).toBeInTheDocument();
  });

  test('given inverted variant then content is rendered', () => {
    // Given / When
    render(
      <RichTextBlock variant="inverted">
        <p>{TEST_PARAGRAPH_TEXT}</p>
      </RichTextBlock>
    );

    // Then
    expect(screen.getByText(TEST_PARAGRAPH_TEXT)).toBeInTheDocument();
  });

  test('given strong text then bold text is rendered', () => {
    // Given / When
    render(
      <RichTextBlock>
        <p>
          Regular text <strong>{TEST_BOLD_TEXT}</strong>
        </p>
      </RichTextBlock>
    );

    // Then
    expect(screen.getByText(TEST_BOLD_TEXT)).toBeInTheDocument();
  });
});
