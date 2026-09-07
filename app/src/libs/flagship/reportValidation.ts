/**
 * The validation snapshot pinned to a report: what the calibration and
 * scorecard checks were matched against when the report was first
 * viewed. Later populace releases and model versions make that stored
 * comparison historical, and the report can say so instead of implying
 * the check still holds — the same drift idea the tracker uses for bill
 * validations, applied to every report.
 */
import type { CalibrationMatches, CalibrationRing } from '@/libs/flagship/calibrationMatching';

export interface ReportValidationMatch {
  variable: string;
  depth: number;
  ring: CalibrationRing;
  targetCount: number;
  meanAbsRelativeError: number;
  worst: { name: string; source: string; geography: string; relativeError: number | null };
}

export interface ReportValidationSnapshot {
  /** ISO timestamp of the match. */
  matchedAt: string;
  /** Model version the dependency map was traced from. */
  mapModelVersion: string;
  calibration: {
    releaseId: string | null;
    geography: string;
    reachedCount: number;
    matches: ReportValidationMatch[];
  } | null;
  scorecard: { programs: string[] } | null;
}

/** What the report is being matched against right now. */
export interface LiveValidation {
  calibration: CalibrationMatches | null | undefined;
  /** Scorecard programs resolved for the report, undefined while loading. */
  programs: string[] | undefined;
}

/** Both checks have resolved (to a result or an honest null). */
export function isLiveValidationSettled(live: LiveValidation): boolean {
  return live.calibration !== undefined && live.programs !== undefined;
}

export function snapshotFromLive(
  live: LiveValidation,
  matchedAt: string = new Date().toISOString()
): ReportValidationSnapshot {
  const calibration = live.calibration ?? null;
  return {
    matchedAt,
    mapModelVersion: calibration?.modelVersion ?? '',
    calibration: calibration
      ? {
          releaseId: calibration.releaseId,
          geography: calibration.geography,
          reachedCount: calibration.reachedCount,
          matches: calibration.matches.map((match) => ({
            variable: match.variable,
            depth: match.depth,
            ring: match.ring,
            targetCount: match.targetCount,
            meanAbsRelativeError: match.meanAbsRelativeError,
            worst: {
              name: match.worst.name,
              source: match.worst.source,
              geography: match.worst.geography,
              relativeError: match.worst.relativeError,
            },
          })),
        }
      : null,
    scorecard: live.programs ? { programs: live.programs } : null,
  };
}

/**
 * Why the stored snapshot no longer describes the live comparison.
 * Empty when the pinned release and model are still current.
 */
export function validationDrift(
  snapshot: ReportValidationSnapshot,
  live: LiveValidation
): string[] {
  const reasons: string[] = [];
  const calibration = live.calibration ?? null;
  if (
    calibration &&
    snapshot.calibration?.releaseId &&
    calibration.releaseId &&
    snapshot.calibration.releaseId !== calibration.releaseId
  ) {
    reasons.push(
      `the calibration dashboard now serves release ${calibration.releaseId} (pinned to ${snapshot.calibration.releaseId})`
    );
  }
  if (
    calibration?.modelVersion &&
    snapshot.mapModelVersion &&
    snapshot.mapModelVersion !== calibration.modelVersion
  ) {
    reasons.push(
      `the dependency map now traces policyengine-us ${calibration.modelVersion} (pinned to ${snapshot.mapModelVersion})`
    );
  }
  return reasons;
}

/* Wire format (snake_case), as the report store's API speaks it. */

export interface ReportValidationWire {
  matched_at: string;
  map_model_version: string;
  calibration: {
    release_id: string | null;
    geography: string;
    reached_count: number;
    matches: Array<{
      variable: string;
      depth: number;
      ring: CalibrationRing;
      target_count: number;
      mean_abs_relative_error: number;
      worst: { name: string; source: string; geography: string; relative_error: number | null };
    }>;
  } | null;
  scorecard: { programs: string[] } | null;
}

export function validationToWire(snapshot: ReportValidationSnapshot): ReportValidationWire {
  return {
    matched_at: snapshot.matchedAt,
    map_model_version: snapshot.mapModelVersion,
    calibration: snapshot.calibration
      ? {
          release_id: snapshot.calibration.releaseId,
          geography: snapshot.calibration.geography,
          reached_count: snapshot.calibration.reachedCount,
          matches: snapshot.calibration.matches.map((match) => ({
            variable: match.variable,
            depth: match.depth,
            ring: match.ring,
            target_count: match.targetCount,
            mean_abs_relative_error: match.meanAbsRelativeError,
            worst: {
              name: match.worst.name,
              source: match.worst.source,
              geography: match.worst.geography,
              relative_error: match.worst.relativeError,
            },
          })),
        }
      : null,
    scorecard: snapshot.scorecard,
  };
}

export function validationFromWire(wire: any): ReportValidationSnapshot | null {
  if (!wire || typeof wire !== 'object' || typeof wire.matched_at !== 'string') {
    return null;
  }
  return {
    matchedAt: wire.matched_at,
    mapModelVersion: typeof wire.map_model_version === 'string' ? wire.map_model_version : '',
    calibration: wire.calibration
      ? {
          releaseId: wire.calibration.release_id ?? null,
          geography: String(wire.calibration.geography ?? 'US'),
          reachedCount: Number(wire.calibration.reached_count ?? 0),
          matches: (wire.calibration.matches ?? []).map((match: any) => ({
            variable: String(match.variable),
            depth: Number(match.depth),
            ring: match.ring,
            targetCount: Number(match.target_count),
            meanAbsRelativeError: Number(match.mean_abs_relative_error),
            worst: {
              name: String(match.worst?.name ?? ''),
              source: String(match.worst?.source ?? ''),
              geography: String(match.worst?.geography ?? ''),
              relativeError:
                typeof match.worst?.relative_error === 'number' ? match.worst.relative_error : null,
            },
          })),
        }
      : null,
    scorecard: wire.scorecard ? { programs: wire.scorecard.programs ?? [] } : null,
  };
}
