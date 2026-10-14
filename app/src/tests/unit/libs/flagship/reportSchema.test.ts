import { describe, expect, test } from 'vitest';
import {
  parseReportMeta,
  parseReportRecord,
  parseReportRow,
  readableReports,
  REPORT_SCHEMA_VERSION,
  reportProvisionsWireError,
  ReportSchemaError,
  reportValidationWireError,
  stampReportMeta,
  stampReportRecord,
  unwrapReport,
} from '@/libs/flagship/reportSchema';
import { validationToWire } from '@/libs/flagship/reportValidation';
import { CENTRAL_REPORT_ID } from '@/tests/fixtures/libs/flagship/ownedItemsMocks';
import {
  CTC_PROVISION,
  CURRENT_SCHEMA_VERSION,
  currentMeta,
  currentRecord,
  historicMeta,
  historicRecords,
  historicRows,
  malformedMeta,
  malformedRecords,
  recordFromNewerVersion,
  recordWithDamagedPin,
  recordWithoutUserId,
  rowWithoutUserId,
  sparseMeta,
  sparseMetaExpected,
} from '@/tests/fixtures/libs/flagship/reportSchemaMocks';
import {
  MATCHED_AT,
  mockReportValidationSnapshot,
} from '@/tests/fixtures/libs/flagship/reportValidationMocks';

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

describe('parseReportRow', () => {
  test.each(historicRows)(
    'given a central row with %s then it reads as a record',
    (_n, row, expected) => {
      expect(parseReportRow(row)).toEqual({ ok: true, value: expected });
    }
  );

  test('given a row with provisions that are not a list then it reads as a typed error', () => {
    const result = parseReportRow({ ...rowWithoutUserId, provisions: 'oops' });

    expect(result.ok ? null : result.error.field).toBe('provisions');
  });

  test('given a row whose pin is too damaged to convert then it reads without the pin', () => {
    const row = {
      ...rowWithoutUserId,
      validation: { matched_at: MATCHED_AT, calibration: { matches: 'x' } },
    };

    expect(parseReportRow(row)).toEqual({
      ok: true,
      value: { ...currentRecord, id: CENTRAL_REPORT_ID, validation: null },
    });
  });

  test('given a row that is not an object then it reads as a typed error', () => {
    const result = parseReportRow('row');

    expect(result.ok ? null : result.error.code).toBe('not-an-object');
  });
});

describe('reportProvisionsWireError', () => {
  test('given provisions as the client sends them then there is no error', () => {
    const wire = [
      {
        path: CTC_PROVISION.path,
        breadcrumb: CTC_PROVISION.breadcrumb,
        unit: CTC_PROVISION.unit,
        baseline_value: CTC_PROVISION.baselineValue,
        value: CTC_PROVISION.value,
      },
    ];

    expect(reportProvisionsWireError(wire)).toBeNull();
  });

  test('given a provision without a path then the error names it', () => {
    expect(reportProvisionsWireError([{ breadcrumb: 'CTC', value: 1 }])).toBe(
      'provisions[0].path must be a non-empty string'
    );
  });

  test('given a provision that is not an object then the error names it', () => {
    expect(reportProvisionsWireError(['CTC'])).toBe('provisions[0] must be an object');
  });
});

describe('reportValidationWireError', () => {
  test('given a pin as the client sends it then there is no error', () => {
    expect(reportValidationWireError(validationToWire(mockReportValidationSnapshot))).toBeNull();
  });

  test.each([
    ['no pin', undefined, 'validation must be a snapshot with matched_at'],
    [
      'scorecard programs that are not a list',
      { ...validationToWire(mockReportValidationSnapshot), scorecard: { programs: 'ctc' } },
      'validation.scorecard.programs must be an array',
    ],
    [
      'a match depth that is not a number',
      {
        ...validationToWire(mockReportValidationSnapshot),
        calibration: { geography: 'US', reached_count: 1, matches: [{ depth: 'deep' }] },
      },
      'validation.calibration.matches[0].depth must be a number',
    ],
  ])('given %s then the error names it', (_name, wire, message) => {
    expect(reportValidationWireError(wire)).toBe(message);
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
