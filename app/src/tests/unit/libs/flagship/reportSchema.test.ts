import { describe, expect, test } from 'vitest';
import {
  parseReportMeta,
  parseReportRecord,
  readableReports,
  REPORT_SCHEMA_VERSION,
  ReportSchemaError,
  stampReportMeta,
  stampReportRecord,
  unwrapReport,
} from '@/libs/flagship/reportSchema';
import {
  CURRENT_SCHEMA_VERSION,
  currentMeta,
  currentRecord,
  GROWING_PROVISION,
  historicMeta,
  historicRecords,
  malformedMeta,
  malformedRecords,
  recordFromNewerVersion,
  recordWithDamagedPin,
  recordWithoutUserId,
  sparseMeta,
  sparseMetaExpected,
} from '@/tests/fixtures/libs/flagship/reportSchemaMocks';

/** What a stored value reads back as after a trip through localStorage. */
function throughStorage(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

describe('REPORT_SCHEMA_VERSION', () => {
  test('given the current schema then writes stamp version 2', () => {
    expect(REPORT_SCHEMA_VERSION).toBe(CURRENT_SCHEMA_VERSION);
  });
});

describe('parseReportMeta', () => {
  test.each(historicMeta)(
    'given unversioned meta from %s then it reads as today',
    (_n, stored, expected) => {
      const result = parseReportMeta(throughStorage(stored));

      expect(result).toEqual({ ok: true, value: expected });
    }
  );

  test('given sparse unversioned meta then the defaults fill what it lacks', () => {
    expect(parseReportMeta(sparseMeta)).toEqual({ ok: true, value: sparseMetaExpected });
  });

  test('given meta written today then it round trips unchanged', () => {
    const stored = throughStorage(stampReportMeta(currentMeta));

    expect(parseReportMeta(stored)).toEqual({ ok: true, value: currentMeta });
  });

  test('given a provision that grows then its growth, timing and rounding read back', () => {
    const result = parseReportMeta(
      throughStorage({ ...currentMeta, provisions: [GROWING_PROVISION] })
    );

    expect(result.ok && result.value.provisions).toEqual([GROWING_PROVISION]);
  });

  test('given meta with fields no version wrote then they are dropped', () => {
    const result = parseReportMeta({ ...currentMeta, stray: 'value' });

    expect(result.ok && result.value).not.toHaveProperty('stray');
  });

  test.each(malformedMeta)(
    'given meta with %s then it reads as a typed error',
    (_name, stored, code, field) => {
      const result = parseReportMeta(stored);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(ReportSchemaError);
        expect(result.error.code).toBe(code);
        expect(result.error.field).toBe(field);
      }
    }
  );

  test.each([undefined, 0, true, {}, { provisions: [null] }, { provisions: [{ path: 1 }] }])(
    'given %j then parsing answers instead of throwing',
    (stored) => {
      expect(() => parseReportMeta(stored)).not.toThrow();
    }
  );
});

describe('parseReportRecord', () => {
  test.each(historicRecords)(
    'given a record from %s then it reads as today',
    (_name, stored, expected) => {
      expect(parseReportRecord(throughStorage(stored))).toEqual({ ok: true, value: expected });
    }
  );

  test('given a record with the shared user id then the id is gone', () => {
    const result = parseReportRecord(historicRecords[0][1]);

    expect(result.ok && result.value).not.toHaveProperty('userId');
  });

  test('given a record written today then it round trips unchanged', () => {
    const stored = throughStorage(stampReportRecord(currentRecord));

    expect(parseReportRecord(stored)).toEqual({ ok: true, value: currentRecord });
  });

  test('given a record whose provision grows then its growth reads back', () => {
    const stored = throughStorage(
      stampReportRecord({ ...currentRecord, provisions: [GROWING_PROVISION] })
    );

    expect(parseReportRecord(stored)).toEqual({
      ok: true,
      value: { ...currentRecord, provisions: [GROWING_PROVISION] },
    });
  });

  test('given a damaged validation pin then the record reads without it', () => {
    const result = parseReportRecord(recordWithDamagedPin);

    expect(result).toEqual({ ok: true, value: { ...currentRecord, validation: null } });
  });

  test.each(malformedRecords)(
    'given a record with %s then it reads as a typed error',
    (_name, stored, code, field) => {
      const result = parseReportRecord(stored);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(code);
        expect(result.error.field).toBe(field);
      }
    }
  );

  test('given a record a newer version saved then it is not read as this version', () => {
    const result = parseReportRecord(recordFromNewerVersion);

    expect(result.ok ? null : result.error.code).toBe('newer-version');
  });
});

describe('parseReportRecord and the account fields', () => {
  test('given a budget window and a compared reform then both read back unchanged', () => {
    const withAccountFields = {
      ...currentRecord,
      budgetWindowYears: 10,
      baselineReformId: 'b5c4d3e2-1f0a-4b9c-8d7e-6f5a4b3c2d1e',
    };

    expect(parseReportRecord(stampReportRecord(withAccountFields))).toEqual({
      ok: true,
      value: withAccountFields,
    });
  });

  test.each([1, 0, 'ten', 2.5])(
    'given a damaged budget window (%s) then it reads as none rather than failing',
    (budgetWindowYears) => {
      const result = parseReportRecord({ ...currentRecord, budgetWindowYears });

      expect(result).toEqual({ ok: true, value: { ...currentRecord, budgetWindowYears: null } });
    }
  );

  test('given a record without a year then it reads, as account rows leave the year to the report', () => {
    const { year: _year, ...withoutYear } = currentRecord;

    expect(parseReportRecord(withoutYear)).toEqual({ ok: true, value: withoutYear });
  });
});

describe('unwrapReport and readableReports', () => {
  test('given an unreadable record then unwrapping throws its ReportSchemaError', () => {
    expect(() => unwrapReport(parseReportRecord({ ...recordWithoutUserId, id: 7 }))).toThrow(
      ReportSchemaError
    );
  });

  test('given readable and unreadable records then only the readable are kept, in order', () => {
    const results = [recordWithoutUserId, 'junk', recordFromNewerVersion].map(parseReportRecord);

    expect(readableReports(results)).toEqual([currentRecord]);
  });
});
