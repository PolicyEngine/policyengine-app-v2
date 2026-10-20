import { describe, expect, test } from 'vitest';
import { getNormalizedVariableMetadata } from '@/utils/variableMetadata';

describe('getNormalizedVariableMetadata', () => {
  test('given a camelCase quantity type then it is kept', () => {
    expect(getNormalizedVariableMetadata({ quantityType: 'stock' }).quantityType).toBe('stock');
  });

  test('given a snake_case quantity type then it is read the same way', () => {
    expect(getNormalizedVariableMetadata({ quantity_type: 'flow' }).quantityType).toBe('flow');
  });

  test('given no quantity type then there is none', () => {
    expect(getNormalizedVariableMetadata({ unit: 'currency-USD' }).quantityType).toBeUndefined();
  });
});
