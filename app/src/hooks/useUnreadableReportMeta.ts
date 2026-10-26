import { useMemo, useState } from 'react';
import type { ReportSchemaError } from '@/libs/flagship/reportSchema';
import { readReportMetaResult, removeReportMeta } from '@/libs/flagship/runReport';

export interface UnreadableReportMeta {
  /** Why the stored provenance can't be read; null when it can, none is stored, or it is set aside. */
  error: ReportSchemaError | null;
  /** Opens the report without it: the page rebuilds the provenance from the policy. */
  setAside: () => void;
}

/**
 * The provenance this browser stored when it ran the report, when the
 * report schema can't read it. `readReportMeta` answers null for it, so
 * once set aside the page carries on as for a report with none stored.
 *
 * Setting aside damaged provenance removes it, since no version of the
 * app can read it, so the report opens without asking next time.
 * Provenance a newer version saved stays stored for that version.
 */
export function useUnreadableReportMeta(userReportId: string): UnreadableReportMeta {
  const [setAsideId, setSetAsideId] = useState<string | null>(null);
  // Read once per report: the page reads the provenance on every render.
  const error = useMemo(() => {
    const result = readReportMetaResult(userReportId);
    return result && !result.ok ? result.error : null;
  }, [userReportId]);
  const setAside = () => {
    if (error && error.code !== 'newer-version') {
      removeReportMeta(userReportId);
    }
    setSetAsideId(userReportId);
  };
  return { error: setAsideId === userReportId ? null : error, setAside };
}
