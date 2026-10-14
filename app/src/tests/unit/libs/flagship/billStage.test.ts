import { describe, expect, test } from 'vitest';
import { BILL_STAGE_LABELS, billStage } from '@/libs/flagship/billStage';
import {
  ENACTED_STATUSES,
  FAILED_STATUSES,
  PROPOSED_STATUSES,
  UNSET_STATUSES,
} from '@/tests/fixtures/libs/flagship/billFilterMocks';

describe('billStage', () => {
  test.each(ENACTED_STATUSES)('given "%s" then the bill is enacted', (status) => {
    expect(billStage(status)).toBe('enacted');
  });

  test.each(PROPOSED_STATUSES)('given "%s" then the bill is proposed', (status) => {
    expect(billStage(status)).toBe('proposed');
  });

  test.each(FAILED_STATUSES)('given "%s" then the bill failed', (status) => {
    expect(billStage(status)).toBe('failed');
  });

  test.each(UNSET_STATUSES)(
    'given no status the tracker set (%s) then it reads as proposed',
    (status) => {
      expect(billStage(status)).toBe('proposed');
    }
  );

  test('given words that only contain a stage word then the stage does not change', () => {
    // "Unsigned" is not signed, and a deadline is not a dead bill.
    expect(billStage('Unsigned')).toBe('proposed');
    expect(billStage('Committee deadline extended')).toBe('proposed');
  });
});

describe('BILL_STAGE_LABELS', () => {
  test('given each stage then it has one plain label', () => {
    expect(BILL_STAGE_LABELS).toEqual({
      enacted: 'Enacted',
      proposed: 'Proposed',
      failed: 'Failed',
    });
  });
});
