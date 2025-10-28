import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import CTASection from '@/components/shared/static/CTASection';
import {
  TEST_BUTTON_HREF,
  TEST_BUTTON_TEXT,
  TEST_CAPTION,
  TEST_CTA_CONTENT_TEXT,
  TEST_SECTION_TITLE,
} from '@/tests/fixtures/components/shared/static/CTASectionMocks';

describe('CTASection', () => {
  test('given title then heading is rendered', () => {
    // Given
    const content = <div>CTA content</div>;
    const cta = { text: TEST_BUTTON_TEXT, href: TEST_BUTTON_HREF };

    // When
    render(<CTASection title={TEST_SECTION_TITLE} content={content} cta={cta} />);

    // Then
    expect(screen.getByRole('heading', { name: TEST_SECTION_TITLE, level: 2 })).toBeInTheDocument();
  });

  test('given no title then heading is not rendered', () => {
    // Given
    const content = <div>CTA content</div>;
    const cta = { text: TEST_BUTTON_TEXT, href: TEST_BUTTON_HREF };

    // When
    render(<CTASection content={content} cta={cta} />);

    // Then
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test('given content then content is rendered', () => {
    // Given
    const content = <div>{TEST_CTA_CONTENT_TEXT}</div>;
    const cta = { text: TEST_BUTTON_TEXT, href: TEST_BUTTON_HREF };

    // When
    render(<CTASection content={content} cta={cta} />);

    // Then
    expect(screen.getByText(TEST_CTA_CONTENT_TEXT)).toBeInTheDocument();
  });

  test('given cta then button is rendered', () => {
    // Given
    const content = <div>CTA content</div>;
    const cta = { text: TEST_BUTTON_TEXT, href: TEST_BUTTON_HREF };

    // When
    render(<CTASection content={content} cta={cta} />);

    // Then
    expect(screen.getByRole('link', { name: TEST_BUTTON_TEXT })).toBeInTheDocument();
  });

  test('given caption then caption is rendered below button', () => {
    // Given
    const content = <div>CTA content</div>;
    const cta = { text: TEST_BUTTON_TEXT, href: TEST_BUTTON_HREF };

    // When
    render(<CTASection content={content} cta={cta} caption={TEST_CAPTION} />);

    // Then
    expect(screen.getByText(TEST_CAPTION)).toBeInTheDocument();
  });

  test('given accent variant then section is rendered', () => {
    // Given
    const content = <div>CTA content</div>;
    const cta = { text: TEST_BUTTON_TEXT, href: TEST_BUTTON_HREF };

    // When
    const { container } = render(<CTASection content={content} cta={cta} variant="accent" />);

    // Then
    const sectionBox = container.firstChild as HTMLElement;
    expect(sectionBox.style.backgroundColor).toBeTruthy();
  });
});
