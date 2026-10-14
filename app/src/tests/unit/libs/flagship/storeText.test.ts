import { describe, expect, test } from 'vitest';
import { ReformAdapter } from '@/adapters/ReformAdapter';
import { clampStoreText, MAX_STORE_TEXT_LENGTH } from '@/libs/flagship/storeText';

describe('clampStoreText', () => {
  test('given text within the limit then it passes unchanged, as do null and undefined', () => {
    expect(clampStoreText('CTC expansion')).toBe('CTC expansion');
    expect(clampStoreText(null)).toBeNull();
    expect(clampStoreText(undefined)).toBeUndefined();
  });

  test('given a long bill title then it is cut to the store limit with an ellipsis', () => {
    const title = 'A'.repeat(MAX_STORE_TEXT_LENGTH + 40);

    const clamped = clampStoreText(title);

    expect(clamped).toHaveLength(MAX_STORE_TEXT_LENGTH);
    expect(clamped.endsWith('…')).toBe(true);
  });

  test('given a reform with a long label then its create and update payloads keep within the limit', () => {
    const label = 'B'.repeat(MAX_STORE_TEXT_LENGTH + 1);

    const created = ReformAdapter.toCreationPayload({
      countryId: 'us',
      label,
      parameters: [],
      baseline: 'current-law',
      provenance: { source: 'bill' },
    });
    const updated = ReformAdapter.toUpdatePayload({ label });

    expect(created.label).toHaveLength(MAX_STORE_TEXT_LENGTH);
    expect(updated.label).toHaveLength(MAX_STORE_TEXT_LENGTH);
  });
});
