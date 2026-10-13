import { describe, expect, test } from 'vitest';
import { importSummaryLines } from '@/components/auth/importSummaryText';
import type { LocalImportSummary, LocalItemNote } from '@/libs/auth/localImport';
import { IMPORT_SKIP_REASONS } from '@/types/v2User';

function note(clientRef: string, reason: string): LocalItemNote {
  return { kind: 'reports', clientRef, countryId: 'us', reason };
}

function summary(overrides: Partial<LocalImportSummary> = {}): LocalImportSummary {
  return { imported: 0, skipped: [], unsupported: [], invalid: [], failed: [], ...overrides };
}

describe('importSummaryLines', () => {
  test('given items whose v1 artifact is gone then only those are said to no longer exist', () => {
    // When
    const lines = importSummaryLines(
      summary({
        imported: 3,
        skipped: [
          note('sur-a', IMPORT_SKIP_REASONS.UNKNOWN_LEGACY_REFERENCE),
          note('sur-b', IMPORT_SKIP_REASONS.INVALID),
        ],
        invalid: [note('sup-c', 'no_api_id')],
      })
    );

    // Then
    expect(lines).toEqual([
      'Saved 3 items to your account.',
      '1 item could not be saved because what it refers to no longer exists.',
      '2 items could not be saved.',
      'Nothing was removed from this device.',
    ]);
  });

  test('given only items the server did not accept then none is said to no longer exist', () => {
    // When
    const lines = importSummaryLines(
      summary({ imported: 1, skipped: [note('sur-a', IMPORT_SKIP_REASONS.INVALID)] })
    );

    // Then
    expect(lines.join(' ')).not.toMatch(/no longer exists/);
    expect(lines).toContain('1 item could not be saved.');
  });
});
