/** Public US SPM settings. The API validates the selected certified artifact. */
export type SPMGeographyKind = 'national' | 'county' | 'metro';

export type SPMSelection = {
  forecast_content_sha256?: string | null;
  scenario?: string | null;
  county_vintage?: '2020';
  as_of?: string | null;
} & (
  | { geography_kind: 'national' | 'county'; geography_id?: null }
  | { geography_kind: 'metro'; geography_id: string }
);

export type ResolvedSPMSelection = {
  forecast_content_sha256: string;
  scenario: string;
  county_vintage: '2020';
  as_of: string | null;
} & (
  | { geography_kind: 'national' | 'county'; geography_id: null }
  | { geography_kind: 'metro'; geography_id: string }
);

export interface SPMMetadata {
  available: boolean;
  defaults?: SPMSelection;
  settings_schema?: Record<string, unknown>;
}

export interface SPMRuntimeVersions {
  policyengine: string;
  'policyengine-core': string;
  'policyengine-us': string;
  'spm-calculator': string;
}

interface SPMProvenanceBase {
  schema_version: 'canonical-spm-provenance-v2';
  forecast_id: string;
  forecast_sha256: string;
  scenario: string;
  county_vintage: string;
  as_of: string | null;
  years: string[];
  runtime_versions: SPMRuntimeVersions;
}

export type SPMProvenance = SPMProvenanceBase &
  (
    | { geography_kind: 'national' | 'county'; geography_id: null }
    | { geography_kind: 'metro'; geography_id: string }
  );

export interface SPMExecutionProvenance {
  receipt: SPMProvenance;
  execution_count: number;
}

export interface SPMComparisonProvenance {
  schema_version: 'canonical-spm-comparison-v2';
  baseline: SPMExecutionProvenance;
  reform: SPMExecutionProvenance;
}

export interface SPMCalculationProvenance {
  spm_config: ResolvedSPMSelection;
  spm_provenance: SPMProvenance;
}

export interface SPMComparisonCalculationProvenance {
  spm_config: ResolvedSPMSelection;
  spm_provenance: SPMComparisonProvenance;
}

export interface SPMProvenanceDisplayRow {
  label: string;
  value: string;
}

const SELECTION_KEYS = new Set([
  'geography_kind',
  'geography_id',
  'forecast_content_sha256',
  'scenario',
  'county_vintage',
  'as_of',
]);
const PROVENANCE_KEYS = new Set([
  'schema_version',
  'forecast_id',
  'forecast_sha256',
  'scenario',
  'geography_kind',
  'geography_id',
  'county_vintage',
  'as_of',
  'years',
  'runtime_versions',
]);
const RUNTIME_VERSION_KEYS = new Set([
  'policyengine',
  'policyengine-core',
  'policyengine-us',
  'spm-calculator',
]);
const COMPARISON_KEYS = new Set(['schema_version', 'baseline', 'reform']);
const EXECUTION_KEYS = new Set(['receipt', 'execution_count']);
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const YEAR_PATTERN = /^\d{4}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  record: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
  label: string
): void {
  const unexpected = Object.keys(record).filter((key) => !allowedKeys.has(key));
  if (unexpected.length > 0) {
    throw new Error(`${label} contains unexpected fields: ${unexpected.join(', ')}`);
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireNullableDate(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }
  const date = requireString(value, label);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !ISO_DATE_PATTERN.test(date) ||
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`${label} must be a valid ISO date`);
  }
  return date;
}

function requireGeographyKind(value: unknown, label: string): SPMGeographyKind {
  if (value === 'national' || value === 'county' || value === 'metro') {
    return value;
  }
  throw new Error(`${label} must be national, county, or metro`);
}

function parseRuntimeVersions(value: unknown): SPMRuntimeVersions {
  const record = requireRecord(value, 'SPM runtime versions');
  requireExactKeys(record, RUNTIME_VERSION_KEYS, 'SPM runtime versions');
  for (const key of RUNTIME_VERSION_KEYS) {
    if (!(key in record)) {
      throw new Error(`SPM runtime versions must include ${key}`);
    }
  }
  return {
    policyengine: requireString(record.policyengine, 'policyengine version'),
    'policyengine-core': requireString(record['policyengine-core'], 'policyengine-core version'),
    'policyengine-us': requireString(record['policyengine-us'], 'policyengine-us version'),
    'spm-calculator': requireString(record['spm-calculator'], 'spm-calculator version'),
  };
}

function parseYears(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((year) => typeof year === 'string')) {
    throw new Error('SPM years must be an array of four-digit strings');
  }
  const years = [...value];
  if (years.some((year) => !YEAR_PATTERN.test(year))) {
    throw new Error('SPM years must be an array of four-digit strings');
  }
  const sortedUnique = [...new Set(years)].sort();
  if (
    sortedUnique.length !== years.length ||
    years.some((year, index) => sortedUnique[index] !== year)
  ) {
    throw new Error('SPM years must be sorted and unique');
  }
  return years;
}

/** Parse public SPM settings without accepting undocumented fields. */
export function parseSPMSelection(value: unknown): SPMSelection {
  try {
    const record = requireRecord(value, 'SPM selection');
    requireExactKeys(record, SELECTION_KEYS, 'SPM selection');
    const geographyKind = requireGeographyKind(record.geography_kind, 'SPM geography kind');
    const optional = {
      ...(record.forecast_content_sha256 !== undefined
        ? {
            forecast_content_sha256:
              record.forecast_content_sha256 === null
                ? null
                : requireString(record.forecast_content_sha256, 'SPM forecast digest'),
          }
        : {}),
      ...(record.scenario !== undefined
        ? {
            scenario:
              record.scenario === null ? null : requireString(record.scenario, 'SPM scenario'),
          }
        : {}),
      ...(record.county_vintage !== undefined
        ? {
            county_vintage:
              record.county_vintage === '2020'
                ? ('2020' as const)
                : (() => {
                    throw new Error('SPM county vintage must be 2020');
                  })(),
          }
        : {}),
      ...(record.as_of !== undefined
        ? { as_of: requireNullableDate(record.as_of, 'SPM as-of date') }
        : {}),
    };
    if (geographyKind === 'metro') {
      return {
        geography_kind: geographyKind,
        geography_id: requireString(record.geography_id, 'SPM metro identifier'),
        ...optional,
      };
    }
    if (record.geography_id !== undefined && record.geography_id !== null) {
      throw new Error('SPM geography identifier is only valid for metro selections');
    }
    return {
      geography_kind: geographyKind,
      ...(record.geography_id === null ? { geography_id: null } : {}),
      ...optional,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Invalid SPM selection: ${detail}`);
  }
}

/** Parse the fully resolved settings stored beside a completed SPM receipt. */
export function parseResolvedSPMSelection(value: unknown): ResolvedSPMSelection {
  try {
    const record = requireRecord(value, 'Resolved SPM selection');
    requireExactKeys(record, SELECTION_KEYS, 'Resolved SPM selection');
    for (const key of SELECTION_KEYS) {
      if (!(key in record)) {
        throw new Error(`Resolved SPM selection must include ${key}`);
      }
    }
    const digest = requireString(record.forecast_content_sha256, 'SPM forecast digest');
    if (!SHA256_PATTERN.test(digest)) {
      throw new Error('SPM forecast digest must be a lowercase SHA-256 value');
    }
    if (record.county_vintage !== '2020') {
      throw new Error('SPM county vintage must be 2020');
    }
    const common = {
      forecast_content_sha256: digest,
      scenario: requireString(record.scenario, 'SPM scenario'),
      county_vintage: '2020' as const,
      as_of: requireNullableDate(record.as_of, 'SPM as-of date'),
    };
    const geographyKind = requireGeographyKind(record.geography_kind, 'SPM geography kind');
    if (geographyKind === 'metro') {
      return {
        ...common,
        geography_kind: geographyKind,
        geography_id: requireString(record.geography_id, 'SPM metro identifier'),
      };
    }
    if (record.geography_id !== null) {
      throw new Error('SPM geography identifier must be null outside metro calculations');
    }
    return { ...common, geography_kind: geographyKind, geography_id: null };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Invalid resolved SPM selection: ${detail}`);
  }
}

/** Parse the compact, versioned SPM receipt and reject legacy diagnostic payloads. */
export function parseSPMProvenance(value: unknown): SPMProvenance {
  try {
    const record = requireRecord(value, 'SPM provenance');
    requireExactKeys(record, PROVENANCE_KEYS, 'SPM provenance');
    for (const key of PROVENANCE_KEYS) {
      if (!(key in record)) {
        throw new Error(`SPM provenance must include ${key}`);
      }
    }
    if (record.schema_version !== 'canonical-spm-provenance-v2') {
      throw new Error('SPM provenance has an unsupported schema version');
    }
    const digest = requireString(record.forecast_sha256, 'SPM forecast digest');
    if (!SHA256_PATTERN.test(digest)) {
      throw new Error('SPM forecast digest must be a lowercase SHA-256 value');
    }
    const countyVintage = requireString(record.county_vintage, 'SPM county vintage');
    if (!YEAR_PATTERN.test(countyVintage)) {
      throw new Error('SPM county vintage must be a four-digit year');
    }
    const geographyKind = requireGeographyKind(record.geography_kind, 'SPM geography kind');
    const common: SPMProvenanceBase = {
      schema_version: 'canonical-spm-provenance-v2',
      forecast_id: requireString(record.forecast_id, 'SPM forecast identifier'),
      forecast_sha256: digest,
      scenario: requireString(record.scenario, 'SPM scenario'),
      county_vintage: countyVintage,
      as_of: requireNullableDate(record.as_of, 'SPM as-of date'),
      years: parseYears(record.years),
      runtime_versions: parseRuntimeVersions(record.runtime_versions),
    };
    if (geographyKind === 'metro') {
      return {
        ...common,
        geography_kind: geographyKind,
        geography_id: requireString(record.geography_id, 'SPM metro identifier'),
      };
    }
    if (record.geography_id !== null) {
      throw new Error('SPM geography identifier must be null outside metro calculations');
    }
    return { ...common, geography_kind: geographyKind, geography_id: null };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Invalid SPM provenance: ${detail}`);
  }
}

function parseExecutionProvenance(value: unknown): SPMExecutionProvenance {
  const record = requireRecord(value, 'SPM execution provenance');
  requireExactKeys(record, EXECUTION_KEYS, 'SPM execution provenance');
  const count = record.execution_count;
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
    throw new Error('SPM execution count must be a positive integer');
  }
  return { receipt: parseSPMProvenance(record.receipt), execution_count: count };
}

/** Parse one compact baseline/reform receipt for a society-wide calculation. */
export function parseSPMComparisonProvenance(value: unknown): SPMComparisonProvenance {
  try {
    const record = requireRecord(value, 'SPM comparison provenance');
    requireExactKeys(record, COMPARISON_KEYS, 'SPM comparison provenance');
    if (record.schema_version !== 'canonical-spm-comparison-v2') {
      throw new Error('SPM comparison provenance has an unsupported schema version');
    }
    const baseline = parseExecutionProvenance(record.baseline);
    const reform = parseExecutionProvenance(record.reform);
    if (JSON.stringify(baseline.receipt) !== JSON.stringify(reform.receipt)) {
      throw new Error('Baseline and reform SPM receipts must match');
    }
    return {
      schema_version: 'canonical-spm-comparison-v2',
      baseline,
      reform,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Invalid SPM comparison provenance: ${detail}`);
  }
}

function assertSelectionMatchesReceipt(
  selection: ResolvedSPMSelection,
  receipt: SPMProvenance
): void {
  const mismatched =
    selection.geography_kind !== receipt.geography_kind ||
    selection.geography_id !== receipt.geography_id ||
    selection.forecast_content_sha256 !== receipt.forecast_sha256 ||
    selection.scenario !== receipt.scenario ||
    selection.county_vintage !== receipt.county_vintage ||
    selection.as_of !== receipt.as_of;
  if (mismatched) {
    throw new Error('SPM selection does not match the calculation receipt');
  }
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.hasOwn(record, key);
}

/** Parse optional SPM fields from a household calculation envelope. */
export function parseOptionalSPMCalculationProvenance(
  value: unknown
): SPMCalculationProvenance | null {
  const record = requireRecord(value, 'Household calculation');
  const hasConfig = hasOwn(record, 'spm_config') && record.spm_config !== undefined;
  const hasProvenance = hasOwn(record, 'spm_provenance') && record.spm_provenance !== undefined;
  if (!hasConfig && !hasProvenance) {
    return null;
  }
  if (!hasConfig || !hasProvenance) {
    throw new Error('SPM calculation requires spm_config and spm_provenance together');
  }
  const spmConfig = parseResolvedSPMSelection(record.spm_config);
  const spmProvenance = parseSPMProvenance(record.spm_provenance);
  assertSelectionMatchesReceipt(spmConfig, spmProvenance);
  return { spm_config: spmConfig, spm_provenance: spmProvenance };
}

/** Parse required SPM fields from a completed US society-wide result. */
export function parseRequiredSPMComparisonCalculationProvenance(
  value: unknown
): SPMComparisonCalculationProvenance {
  const record = requireRecord(value, 'US society-wide calculation');
  const hasConfig = hasOwn(record, 'spm_config') && record.spm_config !== undefined;
  const hasProvenance = hasOwn(record, 'spm_provenance') && record.spm_provenance !== undefined;
  if (!hasConfig || !hasProvenance) {
    throw new Error('US society-wide calculation requires spm_config and spm_provenance');
  }
  const spmConfig = parseResolvedSPMSelection(record.spm_config);
  const spmProvenance = parseSPMComparisonProvenance(record.spm_provenance);
  assertSelectionMatchesReceipt(spmConfig, spmProvenance.baseline.receipt);
  assertSelectionMatchesReceipt(spmConfig, spmProvenance.reform.receipt);
  return { spm_config: spmConfig, spm_provenance: spmProvenance };
}

/** Build the concise, human-readable fields shown for a calculation receipt. */
export function buildSPMProvenanceDisplayRows(receipt: SPMProvenance): SPMProvenanceDisplayRow[] {
  const geography =
    receipt.geography_kind === 'national'
      ? 'National'
      : receipt.geography_kind === 'county'
        ? 'County'
        : 'Metropolitan area';
  const rows: SPMProvenanceDisplayRow[] = [
    { label: 'Forecast', value: receipt.forecast_id },
    { label: 'Scenario', value: receipt.scenario },
    { label: 'Geography', value: geography },
  ];
  if (receipt.geography_id !== null) {
    rows.push({ label: 'Geography identifier', value: receipt.geography_id });
  }
  rows.push(
    { label: 'County vintage', value: receipt.county_vintage },
    { label: 'As of', value: receipt.as_of ?? 'Not specified' },
    { label: 'Years', value: receipt.years.length > 0 ? receipt.years.join(', ') : 'None' },
    { label: 'Forecast digest', value: receipt.forecast_sha256 },
    {
      label: 'PolicyEngine version',
      value: receipt.runtime_versions.policyengine,
    },
    {
      label: 'PolicyEngine Core version',
      value: receipt.runtime_versions['policyengine-core'],
    },
    {
      label: 'PolicyEngine US version',
      value: receipt.runtime_versions['policyengine-us'],
    },
    {
      label: 'SPM Calculator version',
      value: receipt.runtime_versions['spm-calculator'],
    }
  );
  return rows;
}
