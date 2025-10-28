import { describe, test, expect } from 'vitest';
import { render, screen } from '@test-utils';
import ContentSection from '@/components/shared/static/ContentSection';
import {
  MOCK_CONTENT_SECTION_PROPS,
  MOCK_CONTENT_SECTION_PROPS_ACCENT,
  TEST_SECTION_TITLE,
  TEST_SECTION_CONTENT,
} from '@/tests/fixtures/components/shared/static/ContentSectionMocks';

describe('ContentSection', () => {
  test('given title then heading is rendered', () => {
    // Given / When
    render(
      <ContentSection {...MOCK_CONTENT_SECTION_PROPS}>
        <div>Content</div>
      </ContentSection>
    );

    // Then
    expect(screen.getByRole('heading', { name: TEST_SECTION_TITLE, level: 2 })).toBeInTheDocument();
  });

  test('given no title then heading is not rendered', () => {
    // Given
    const propsWithoutTitle = { ...MOCK_CONTENT_SECTION_PROPS, title: undefined };

    // When
    render(
      <ContentSection {...propsWithoutTitle}>
        <div>Content</div>
      </ContentSection>
    );

    // Then
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test('given children then content is rendered', () => {
    // Given / When
    render(
      <ContentSection {...MOCK_CONTENT_SECTION_PROPS}>
        <div>{TEST_SECTION_CONTENT}</div>
      </ContentSection>
    );

    // Then
    expect(screen.getByText(TEST_SECTION_CONTENT)).toBeInTheDocument();
  });

  test('given secondary variant then correct background is applied', () => {
    // Given / When
    const { container } = render(
      <ContentSection {...MOCK_CONTENT_SECTION_PROPS}>
        <div>Content</div>
      </ContentSection>
    );

    // Then
    const sectionBox = container.firstChild as HTMLElement;
    expect(sectionBox.style.backgroundColor).toBeTruthy();
  });

  test('given accent variant then correct background is applied', () => {
    // Given / When
    const { container } = render(
      <ContentSection {...MOCK_CONTENT_SECTION_PROPS_ACCENT}>
        <div>Content</div>
      </ContentSection>
    );

    // Then
    const sectionBox = container.firstChild as HTMLElement;
    expect(sectionBox.style.backgroundColor).toBeTruthy();
  });
});
