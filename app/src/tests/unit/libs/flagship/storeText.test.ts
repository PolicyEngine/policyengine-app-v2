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
});
