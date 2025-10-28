import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import {
  TEST_CONTENT_TEXT,
  TEST_PAGE_TITLE,
} from '@/tests/fixtures/components/shared/static/StaticPageLayoutMocks';

describe('StaticPageLayout', () => {
  test('given page title then document title is set', () => {
    // Given / When
    render(
      <StaticPageLayout title={TEST_PAGE_TITLE}>
        <div>Test content</div>
      </StaticPageLayout>
    );

    // Then
    expect(document.title).toBe(`${TEST_PAGE_TITLE} | PolicyEngine`);
  });

  test('given children then content is rendered', () => {
    // Given / When
    render(
      <StaticPageLayout title={TEST_PAGE_TITLE}>
        <div>{TEST_CONTENT_TEXT}</div>
      </StaticPageLayout>
    );

    // Then
    expect(screen.getByText(TEST_CONTENT_TEXT)).toBeInTheDocument();
  });
});
