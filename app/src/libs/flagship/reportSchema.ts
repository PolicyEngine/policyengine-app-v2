/**
 * The stored shape of a v3 report, in one place.
 *
 * A report run stores two things:
 *  - its provenance (`FlagshipReportMeta`): the header's title, source
 *    note and provisions, kept in this browser's localStorage under the
 *    API report id; and
 *  - its record (`FlagshipReportRecord`): the pointer to the API report
 *    plus the same provenance, kept by the report store — the
 *    calculator-app routes (Postgres), or this browser's localStorage
 *    when they are unconfigured.
 *
 * Fields were added over time without a version, so every read goes
 * through a parser here. It upgrades an older shape to the current one,
 * fills safe defaults for fields older writes lacked, and answers a
 * typed error for anything else, instead of a bad field throwing deep
 * in the UI. Every write stamps `schemaVersion`.
 *
 * Versions:
 *  1 — unversioned: everything written before this module.
 *      Meta: title, sourceNote, provisions, createdAt; later provisions
 *      gained `intervals`, and the meta `budgetWindow` and `baseline`.
 *      Record: id, userId, countryId, apiReportId, title, sourceNote,
 *      provisions, year, createdAt; later `reformId` and `validation`,
 *      and then `userId` was dropped.
 *  2 — the same fields, stamped, with defaults filled and no `userId`.
 *
 * To add a field: add it to the type and give it a rule below (the rule
 * maps do not compile until every field has one). A missing field takes
 * the rule's default; when old records need more than a default, bump
 * REPORT_SCHEMA_VERSION and add the upgrade step. A field this version
 * does not know is dropped on read, so a field is only safe to write
 * once its rule is here.
 *
 * Central rows have no version column: their columns are versioned by
 * the database migrations, and the routes always serve the current
 * columns. The rows' JSON fields (provisions, validation) follow the
 * same rules as the browser's records, on the way in and on the way out.
 */
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import { CountryId, countryIds } from '@/libs/countries';
import type { CalibrationRing } from '@/libs/flagship/calibrationMatching';
import {
  validationFromWire,
  type ReportValidationMatch,
  type ReportValidationSnapshot,
} from '@/libs/flagship/reportValidation';
import type { FlagshipReportMeta, RunReportProvision } from '@/libs/flagship/runReport';
import type { ValueInterval } from '@/types/subIngredients/valueInterval';

export type { FlagshipReportMeta, FlagshipReportRecord, RunReportProvision };

/** The version every write stamps. */
export const REPORT_SCHEMA_VERSION = 2;

/** The version of anything stored without a `schemaVersion`. */
export const UNVERSIONED_REPORT_SCHEMA_VERSION = 1;

/**
 * What a report compared the reform with, when not current law: a saved
 * reform run as the baseline policy. Named here as well as on the meta
 * type, so the schema keeps it whether or not that type names it yet.
 */
export interface ReportMetaBaseline {
  /** The saved reform, when the run came from one. */
  reformId: string | null;
  /** The baseline policy on the API. */
  policyId: string;
  /** Its name, for the report's labels. */
  label: string;
}

/** The provenance with every field the schema reads. */
export type ReportMetaFields = FlagshipReportMeta & { baseline?: ReportMetaBaseline };

export type StoredReportMeta = ReportMetaFields & { schemaVersion: number };
export type StoredReportRecord = FlagshipReportRecord & { schemaVersion: number };

export type ReportSchemaErrorCode =
  /** Not a JSON object at all. */
  | 'not-an-object'
  /** A field is present with the wrong type, or a required one is missing. */
  | 'invalid-field'
  /** Stamped by a newer version of the app than this one. */
  | 'newer-version';

/** Why a stored report can't be read. */
export class ReportSchemaError extends Error {
  readonly code: ReportSchemaErrorCode;
  /** The offending field's path, e.g. "provisions[0].path". */
  readonly field?: string;

  constructor(code: ReportSchemaErrorCode, message: string, field?: string) {
    super(message);
    this.name = 'ReportSchemaError';
    this.code = code;
    this.field = field;
  }
}

export type ReportParseResult<T> = { ok: true; value: T } | { ok: false; error: ReportSchemaError };

/** The parsed value; throws its ReportSchemaError when it could not be read. */
export function unwrapReport<T>(result: ReportParseResult<T>): T {
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

/** The values that parsed, in order; the rest are left out. */
export function readableReports<T>(results: Array<ReportParseResult<T>>): T[] {
  return results.flatMap((result) => (result.ok ? [result.value] : []));
}

/* Field rules. A rule returns the field's value in the current shape, or
   throws FieldError; `undefined` leaves an optional field out. */

class FieldError extends Error {
  constructor(
    readonly field: string,
    message: string
  ) {
    super(message);
  }
}

type Rule<T> = (value: unknown, field: string) => T;

/** One rule per field, optional fields included. */
type FieldRules<T> = { [K in keyof T]-?: Rule<T[K]> };

function fail(field: string, expected: string): never {
  throw new FieldError(field, `${field} must be ${expected}`);
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isAbsent = (value: unknown): value is null | undefined =>
  value === undefined || value === null;

const requiredText: Rule<string> = (value, field) =>
  typeof value === 'string' && value.length > 0 ? value : fail(field, 'a non-empty string');

/** A string; absent, the fallback. */
function text(fallback: string): Rule<string> {
  return (value, field) =>
    isAbsent(value) ? fallback : typeof value === 'string' ? value : fail(field, 'a string');
}

const nullableText: Rule<string | null> = (value, field) =>
  isAbsent(value) ? null : typeof value === 'string' ? value : fail(field, 'a string or null');

const integer: Rule<number> = (value, field) =>
  Number.isInteger(value) ? (value as number) : fail(field, 'an integer');

const finiteNumber: Rule<number> = (value, field) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fail(field, 'a number');

const country: Rule<CountryId> = (value, field) =>
  countryIds.includes(value as CountryId)
    ? (value as CountryId)
    : fail(field, `one of ${countryIds.join(', ')}`);

const ring: Rule<CalibrationRing> = (value, field) =>
  value === 'primary' || value === 'mechanism' || value === 'downstream'
    ? value
    : fail(field, 'primary, mechanism or downstream');

/** Parameter values are any JSON; kept exactly as stored. */
const anyValue: Rule<any> = (value) => value;

function optional<T>(rule: Rule<T>): Rule<T | undefined> {
  return (value, field) => (isAbsent(value) ? undefined : rule(value, field));
}

function nullable<T>(rule: Rule<T>): Rule<T | null> {
  return (value, field) => (isAbsent(value) ? null : rule(value, field));
}

function arrayOf<T>(rule: Rule<T>): Rule<T[]> {
  return (value, field) =>
    Array.isArray(value)
      ? value.map((item, index) => rule(item, `${field}[${index}]`))
      : fail(field, 'an array');
}

/** An object with exactly these fields; anything else on it is dropped. */
function shape<T>(rules: FieldRules<T>): Rule<T> {
  return (value, field) => {
    if (!isJsonObject(value)) {
      return fail(field || 'the record', 'an object');
    }
    const parsed: Record<string, unknown> = {};
    for (const [key, rule] of Object.entries(rules) as Array<[string, Rule<unknown>]>) {
      const fieldValue = rule(value[key], field ? `${field}.${key}` : key);
      if (fieldValue !== undefined) {
        parsed[key] = fieldValue;
      }
    }
    return parsed as T;
  };
}

/** A rule whose failure means "leave it out" rather than "unreadable". */
function orNull<T>(rule: Rule<T>): Rule<T | null> {
  return (value, field) => {
    try {
      return rule(value, field);
    } catch (error) {
      if (error instanceof FieldError) {
        return null;
      }
      throw error;
    }
  };
}

const intervalRule = shape<ValueInterval>({
  parameter: optional(text('')),
  startDate: requiredText,
  endDate: requiredText,
  value: anyValue,
});

const provisionFields = shape<RunReportProvision>({
  path: requiredText,
  breadcrumb: text(''),
  unit: nullableText,
  baselineValue: anyValue,
  value: anyValue,
  intervals: optional(arrayOf(intervalRule)),
});

/** A provision; one stored without a breadcrumb is labelled by its path. */
const provisionRule: Rule<RunReportProvision> = (value, field) => {
  const provision = provisionFields(value, field);
  return provision.breadcrumb ? provision : { ...provision, breadcrumb: provision.path };
};

const provisionsRule = arrayOf(provisionRule);

const budgetWindowRule = shape<NonNullable<FlagshipReportMeta['budgetWindow']>>({
  startYear: integer,
  windowSize: (value, field) =>
    Number.isInteger(value) && (value as number) >= 1
      ? (value as number)
      : fail(field, 'a whole number of years'),
});

const baselineRule = shape<ReportMetaBaseline>({
  reformId: nullableText,
  policyId: requiredText,
  label: text(''),
});

const validationMatchRule = shape<ReportValidationMatch>({
  variable: text(''),
  depth: finiteNumber,
  ring,
  targetCount: finiteNumber,
  meanAbsRelativeError: finiteNumber,
  worst: shape<ReportValidationMatch['worst']>({
    name: text(''),
    source: text(''),
    geography: text(''),
    relativeError: nullable(finiteNumber),
  }),
});

const validationRule = shape<ReportValidationSnapshot>({
  matchedAt: requiredText,
  mapModelVersion: text(''),
  calibration: nullable(
    shape<NonNullable<ReportValidationSnapshot['calibration']>>({
      releaseId: nullableText,
      geography: text(''),
      reachedCount: finiteNumber,
      matches: arrayOf(validationMatchRule),
    })
  ),
  scorecard: nullable(
    shape<NonNullable<ReportValidationSnapshot['scorecard']>>({
      programs: arrayOf(text('')),
    })
  ),
});

const metaRule = shape<ReportMetaFields>({
  title: text(''),
  sourceNote: text(''),
  provisions: provisionsRule,
  createdAt: text(''),
  budgetWindow: optional(budgetWindowRule),
  // Absent, the report compares with current law.
  baseline: optional(baselineRule),
});

const recordRule = shape<FlagshipReportRecord>({
  id: requiredText,
  countryId: country,
  apiReportId: requiredText,
  title: nullableText,
  sourceNote: nullableText,
  provisions: provisionsRule,
  year: requiredText,
  createdAt: text(''),
  reformId: nullableText,
  // The pin is a cache of what validation matched: a damaged one is
  // dropped, and the report pins again, rather than the record failing.
  validation: orNull(validationRule),
});

/* Upgrades, keyed by the version they upgrade from. */

type Upgrade = (stored: Record<string, unknown>) => Record<string, unknown>;

const META_UPGRADES: Record<number, Upgrade> = {
  // Unversioned meta has today's fields; the rules fill what it lacks.
  1: (stored) => stored,
};

const RECORD_UPGRADES: Record<number, Upgrade> = {
  // Records saved before ownership moved to edit tokens carry the shared user id.
  1: ({ userId: _userId, ...stored }) => stored,
};

function parseVersioned<T>(
  stored: unknown,
  upgrades: Record<number, Upgrade>,
  rule: Rule<T>
): ReportParseResult<T> {
  if (!isJsonObject(stored)) {
    return {
      ok: false,
      error: new ReportSchemaError('not-an-object', 'The stored report is not an object'),
    };
  }
  const version = stored.schemaVersion ?? UNVERSIONED_REPORT_SCHEMA_VERSION;
  if (!Number.isInteger(version) || (version as number) < UNVERSIONED_REPORT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: new ReportSchemaError(
        'invalid-field',
        'schemaVersion must be a positive integer',
        'schemaVersion'
      ),
    };
  }
  if ((version as number) > REPORT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: new ReportSchemaError(
        'newer-version',
        `Saved with report schema ${version}; this version reads up to ${REPORT_SCHEMA_VERSION}`,
        'schemaVersion'
      ),
    };
  }
  let current = stored;
  for (let from = version as number; from < REPORT_SCHEMA_VERSION; from++) {
    current = upgrades[from](current);
  }
  try {
    return { ok: true, value: rule(current, '') };
  } catch (error) {
    if (error instanceof FieldError) {
      return {
        ok: false,
        error: new ReportSchemaError('invalid-field', error.message, error.field),
      };
    }
    throw error;
  }
}

/** Reads a report's stored provenance, of any version, in the current shape. */
export function parseReportMeta(stored: unknown): ReportParseResult<FlagshipReportMeta> {
  return parseVersioned(stored, META_UPGRADES, metaRule);
}

/** Reads a stored report record, of any version, in the current shape. */
export function parseReportRecord(stored: unknown): ReportParseResult<FlagshipReportRecord> {
  return parseVersioned(stored, RECORD_UPGRADES, recordRule);
}

/** Provisions as the central store speaks them (snake_case), in the record's names. */
function provisionsFromWire(provisions: unknown): unknown {
  if (!Array.isArray(provisions)) {
    return provisions;
  }
  return provisions.map((provision) =>
    isJsonObject(provision)
      ? {
          path: provision.path,
          breadcrumb: provision.breadcrumb,
          unit: provision.unit,
          baselineValue: provision.baseline_value,
          value: provision.value,
        }
      : provision
  );
}

/** A validation pin from the wire; one too damaged to convert reads as none. */
function validationFromWireOrNull(wire: unknown): ReportValidationSnapshot | null {
  try {
    return validationFromWire(wire);
  } catch {
    return null;
  }
}

/** Reads a central store row (the routes' snake_case wire form) as a record. */
export function parseReportRow(row: unknown): ReportParseResult<FlagshipReportRecord> {
  if (!isJsonObject(row)) {
    return parseReportRecord(row);
  }
  return parseReportRecord({
    // The routes serve the current columns (see above).
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: row.id,
    countryId: row.country_id,
    apiReportId: row.api_report_id,
    title: row.title,
    sourceNote: row.source_note,
    provisions: provisionsFromWire(row.provisions),
    year: row.year,
    createdAt: row.created_at,
    reformId: row.reform_id,
    validation: validationFromWireOrNull(row.validation),
  });
}

/** The rule's error message for this value, or null when it fits. */
function wireError<T>(rule: Rule<T>, value: unknown, field: string): string | null {
  try {
    rule(value, field);
    return null;
  } catch (error) {
    if (error instanceof FieldError) {
      return error.message;
    }
    throw error;
  }
}

/**
 * Why a create body's provisions (snake_case) break the report schema,
 * or null when they fit: the same rules the client reads them back with.
 */
export function reportProvisionsWireError(provisions: unknown): string | null {
  return wireError(provisionsRule, provisionsFromWire(provisions), 'provisions');
}

/**
 * Why a validation pin (snake_case) breaks the report schema, or null
 * when it fits: the same rules the client reads it back with.
 */
export function reportValidationWireError(validation: unknown): string | null {
  const snapshot = validationFromWireOrNull(validation);
  if (!snapshot) {
    return 'validation must be a snapshot with matched_at';
  }
  return wireError(validationRule, snapshot, 'validation');
}

/** Provenance as it is written: stamped with the current version. */
export function stampReportMeta(meta: FlagshipReportMeta): StoredReportMeta {
  return { ...meta, schemaVersion: REPORT_SCHEMA_VERSION };
}

/** A record as it is written: stamped with the current version. */
export function stampReportRecord(record: FlagshipReportRecord): StoredReportRecord {
  return { ...record, schemaVersion: REPORT_SCHEMA_VERSION };
}
