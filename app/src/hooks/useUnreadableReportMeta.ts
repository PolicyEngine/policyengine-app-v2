import { useState } from 'react';
import type { ReportSchemaError } from '@/libs/flagship/reportSchema';
import { readReportMetaResult } from '@/libs/flagship/runReport';

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
 * Nothing is deleted: setting it aside only stops this page asking.
 */
export function useUnreadableReportMeta(userReportId: string): UnreadableReportMeta {
  const [setAsideId, setSetAsideId] = useState<string | null>(null);
  const setAside = () => setSetAsideId(userReportId);
  if (setAsideId === userReportId) {
    return { error: null, setAside };
  }
  const result = readReportMetaResult(userReportId);
  return { error: result && !result.ok ? result.error : null, setAside };
}
