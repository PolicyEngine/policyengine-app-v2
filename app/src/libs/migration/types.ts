import type { CountryId } from '@/libs/countries';

/**
 * Result of migrating a single entity (base or association).
 */
export interface MigrationResult<T = string> {
  success: boolean;
  v2Id?: T | null;
  v1Id: string;
  error?: string;
  warnings?: string[];
}

/**
 * A single error that occurred during orchestration.
 */
export interface MigrationError {
  stage: string;
  v1Id: string;
  message: string;
}

/**
 * Result of an orchestrator migrating a full user-ingredient tree.
 */
export interface OrchestratorResult {
  success: boolean;
  v1UserAssociationId: string;
  v1ReportId: string;
  label?: string;
  v2Ids: {
    baseEntityId?: string | null;
    userAssociationId?: string;
    dependencyIds?: Record<string, string | null>;
  };
  errors: MigrationError[];
  warnings: string[];
}

/**
 * Aggregate result from migrating all v1 reports.
 */
export interface MigrationRunResult {
  total: number;
  succeeded: OrchestratorResult[];
  failed: OrchestratorResult[];
}

/**
 * Progress callback payload.
 */
export interface MigrationProgress {
  current: number;
  total: number;
  currentLabel?: string;
}

/**
 * Info about a detected v1 report in localStorage.
 */
export interface V1ReportInfo {
  userReportId: string;
  reportId: string;
  label?: string;
  countryId: CountryId;
}

/**
 * Summary of what was removed during cleanup.
 */
export interface CleanupSummary {
  removedReports: number;
  removedSimulations: number;
  removedPolicies: number;
  removedHouseholds: number;
  errors: string[];
}

/**
 * Result of detecting v1 reports in localStorage.
 * Distinguishes "no reports" (reports=[]) from "corrupt data" (reports=[], error=...).
 */
export interface DetectionResult {
  reports: V1ReportInfo[];
  error?: string;
}
