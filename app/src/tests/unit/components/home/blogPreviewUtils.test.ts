import { describe, expect, test } from 'vitest';
import { formatPostDate, getPostImageUrl } from '@/components/home/blogPreviewUtils';
import {
  MOCK_GLOBAL_POST,
  MOCK_POST_NO_IMAGE,
  MOCK_US_POST_NEWEST,
} from '@/tests/fixtures/components/home/blogPreviewMocks';

describe('getPostImageUrl', () => {
  test('given post with local image then returns assets path', () => {
    // When
    const result = getPostImageUrl(MOCK_US_POST_NEWEST);

    // Then
    expect(result).toBe(`/assets/posts/${MOCK_US_POST_NEWEST.image}`);
  });

  test('given post with http image then returns URL directly', () => {
    // When
    const result = getPostImageUrl(MOCK_GLOBAL_POST);

    // Then
    expect(result).toBe(MOCK_GLOBAL_POST.image);
  });

  test('given post with empty image then returns empty string', () => {
    // When
    const result = getPostImageUrl(MOCK_POST_NO_IMAGE);

    // Then
    expect(result).toBe('');
  });
});

describe('formatPostDate', () => {
  test('given date string then returns formatted date', () => {
    // When
    const result = formatPostDate('2026-01-13 12:00:00');

    // Then
    expect(result).toBe('Jan 13, 2026');
  });

  test('given date-only string then returns formatted date', () => {
    // When
    const result = formatPostDate('2026-01-12');

    // Then
    expect(result).toBe('Jan 12, 2026');
  });
});

describe('formatPostDate month style', () => {
  test('given date-only string then long month reads as the same calendar day', () => {
    // When
    const result = formatPostDate('2026-09-15', 'long');

    // Then
    expect(result).toBe('September 15, 2026');
  });

  test('given date-only string then short month is the default', () => {
    // When
    const result = formatPostDate('2026-09-15');

    // Then
    expect(result).toBe('Sep 15, 2026');
  });
});
