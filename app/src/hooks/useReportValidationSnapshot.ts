import { useEffect, useRef, useState } from 'react';
import { findReportRecordByLink } from '@/api/flagshipReportStore';
import { useFlagshipReportStore } from '@/hooks/useFlagshipStores';
import {
  isLiveValidationSettled,
  LiveValidation,
  ReportValidationSnapshot,
  snapshotFromLive,
  validationDrift,
} from '@/libs/flagship/reportValidation';

export interface ReportValidationState {
  /** The pinned snapshot, null when none is stored yet or no record exists. */
  snapshot: ReportValidationSnapshot | null;
  /** Why the pinned snapshot no longer matches the live comparison. */
  drift: string[];
}

/**
 * Pins the live validation to the record the report's link names the
 * first time both checks settle, and reports drift between that pin and
 * what the checks see now. Only the session that ran the report pins;
 * anyone else sees the owner's pin (`sharedSnapshot`), when there is one.
 * Best-effort: a report without a record (storage was unavailable at run
 * time) simply never pins.
 */
export function useReportValidationSnapshot(
  userReportId: string | undefined,
  live: LiveValidation,
  sharedSnapshot: ReportValidationSnapshot | null = null,
  /**
   * The v1 report the link shows. A saved report moved onto a new run
   * keeps its link, so its record is read again when this changes.
   */
  runId?: string
): ReportValidationState {
  const { store } = useFlagshipReportStore();
  // The record is read again only when one known run is replaced by
  // another, not when the page first learns which run it shows: a
  // second read would let a record with no pin be pinned twice.
  const [knownRunId, setKnownRunId] = useState(runId);
  const [runsReplaced, setRunsReplaced] = useState(0);
  if (runId !== undefined && runId !== knownRunId) {
    setKnownRunId(runId);
    if (knownRunId !== undefined) {
      setRunsReplaced((count) => count + 1);
    }
  }
  const [snapshot, setSnapshot] = useState<ReportValidationSnapshot | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const pinned = useRef(false);

  useEffect(() => {
    let cancelled = false;
    pinned.current = false;
    setSnapshot(null);
    setRecordId(null);
    if (!userReportId) {
      return;
    }
    findReportRecordByLink(store, userReportId)
      .then((record) => {
        if (cancelled || !record) {
          return;
        }
        setRecordId(record.id);
        if (record.validation) {
          setSnapshot(record.validation);
          pinned.current = true;
        }
      })
      .catch(() => {
        // No record, no pin: the live comparison still renders.
      });
    return () => {
      cancelled = true;
    };
  }, [store, userReportId, runsReplaced]);

  const settled = isLiveValidationSettled(live);
  useEffect(() => {
    if (!recordId || pinned.current || !settled) {
      return;
    }
    pinned.current = true;
    const fresh = snapshotFromLive(live);
    store
      .saveValidation(recordId, fresh)
      .then((record) => setSnapshot(record.validation ?? fresh))
      .catch(() => {
        pinned.current = false;
      });
    // `live` is read once at pin time; re-running on its identity would re-pin.
  }, [recordId, settled]);

  const shown = snapshot ?? sharedSnapshot;
  return { snapshot: shown, drift: shown ? validationDrift(shown, live) : [] };
}
