import { describe, expect, test } from 'vitest';
import {
  clampStoreText,
  MAX_STORE_NAME_LENGTH,
  MAX_STORE_NOTE_LENGTH,
} from '@/libs/flagship/storeText';

describe('clampStoreText', () => {
  test('given text within the limit then it passes unchanged, as do null and undefined', () => {
    expect(clampStoreText('CTC expansion')).toBe('CTC expansion');
    expect(clampStoreText(null)).toBeNull();
    expect(clampStoreText(undefined)).toBeUndefined();
  });

  test('given a long bill title then it is cut to the name limit with an ellipsis', () => {
    const title = 'A'.repeat(MAX_STORE_NAME_LENGTH + 40);

    const clamped = clampStoreText(title);

    expect(clamped).toHaveLength(MAX_STORE_NAME_LENGTH);
    expect(clamped.endsWith('…')).toBe(true);
  });

  test('given a long note then it is cut to the note limit', () => {
    const note = 'B'.repeat(MAX_STORE_NOTE_LENGTH + 1);

    expect(clampStoreText(note, MAX_STORE_NOTE_LENGTH)).toHaveLength(MAX_STORE_NOTE_LENGTH);
  });

  test('given an emoji at the cut then it is kept whole, never split into half a character', () => {
    // 253 letters put the emoji (two UTF-16 units) across the old cut point.
    const title = `${'A'.repeat(MAX_STORE_NAME_LENGTH - 2)}🎉${'B'.repeat(20)}`;

    const clamped = clampStoreText(title);

    expect(Array.from(clamped)).toHaveLength(MAX_STORE_NAME_LENGTH);
    expect(clamped.endsWith('🎉…')).toBe(true);
    expect(clamped.isWellFormed()).toBe(true);
  });

  test('given a name with emoji within the limit in characters then it is not cut', () => {
    // 250 emoji are 500 UTF-16 units but 250 characters, as the API counts.
    const title = '🎉'.repeat(MAX_STORE_NAME_LENGTH - 5);

    expect(clampStoreText(title)).toBe(title);
  });
});
