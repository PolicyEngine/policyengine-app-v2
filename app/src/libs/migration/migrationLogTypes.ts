export type MigrationFieldStatus = 'MATCH' | 'MISMATCH' | 'SKIPPED';
export type MigrationComparisonStatus = 'MATCH' | 'DIVERGE';
export type MigrationEventStatus = 'FAILED' | 'SKIPPED';

export type MigrationLogMetadata = Record<string, string | number | boolean | null>;

export interface MigrationFieldDetail {
  field: string;
  status: MigrationFieldStatus;
  v1: string;
  v2: string;
}

interface BaseMigrationLogPayload {
  prefix: string;
  ts: string;
  pathname?: string;
  href?: string;
}

export interface MigrationComparisonLogPayload extends BaseMigrationLogPayload {
  kind: 'comparison';
  operation: string;
  status: MigrationComparisonStatus;
  compared: number;
  matches: number;
  mismatches: number;
  skipped: number;
  detailCount: number;
  truncatedDetailCount?: number;
  details: MigrationFieldDetail[];
}

export interface MigrationEventLogPayload extends BaseMigrationLogPayload {
  kind: 'event';
  status: MigrationEventStatus;
  message: string;
  operation?: string;
  metadata?: MigrationLogMetadata;
}

export type MigrationRemoteLogPayload = MigrationComparisonLogPayload | MigrationEventLogPayload;
