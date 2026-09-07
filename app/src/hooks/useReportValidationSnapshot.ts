import { useEffect, useRef, useState } from 'react';
import { getFlagshipReportStore } from '@/api/flagshipReportStore';
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
 * Pins the live validation to the report's store record the first time
 * both checks settle, and reports drift between that pin and what the
 * checks see now. Best-effort: a report without a store record (the
 * central store was unavailable at run time) simply never pins.
 */
export function useReportValidationSnapshot(
  userId: string,
  apiReportId: string | undefined,
  live: LiveValidation
): ReportValidationState {
  const [snapshot, setSnapshot] = useState<ReportValidationSnapshot | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const pinned = useRef(false);

  useEffect(() => {
    let cancelled = false;
    pinned.current = false;
    setSnapshot(null);
    setRecordId(null);
    if (!apiReportId) {
      return;
    }
    getFlagshipReportStore()
      .findByApiReportId(userId, apiReportId)
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
  }, [userId, apiReportId]);

  const settled = isLiveValidationSettled(live);
  useEffect(() => {
    if (!recordId || pinned.current || !settled) {
      return;
    }
    pinned.current = true;
    const fresh = snapshotFromLive(live);
    getFlagshipReportStore()
      .saveValidation(recordId, fresh)
      .then((record) => setSnapshot(record.validation ?? fresh))
      .catch(() => {
        pinned.current = false;
      });
    // `live` is read once at pin time; re-running on its identity would re-pin.
  }, [recordId, settled]);

  return { snapshot, drift: snapshot ? validationDrift(snapshot, live) : [] };
}
