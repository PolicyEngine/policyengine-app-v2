import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  declineImport,
  isImportDeclined,
  planLocalImport,
  runLocalImport,
  type LocalImportSummary,
} from '@/libs/auth/localImport';
import { useAssociationBackend } from '@/libs/auth/useAssociationBackend';
import {
  householdAssociationKeys,
  policyAssociationKeys,
  reportAssociationKeys,
  simulationAssociationKeys,
} from '@/libs/queryKeys';

export type LocalImportState = 'idle' | 'running' | 'done' | 'error';

export interface LocalDataImport {
  /** True when signed in somewhere with account storage (US, UK). */
  available: boolean;
  /** Items in this browser the account does not have yet. */
  pendingCount: number;
  /** Items from countries without account storage; they stay on this device. */
  unsupportedCount: number;
  declined: boolean;
  state: LocalImportState;
  summary: LocalImportSummary | null;
  error: string | null;
  run: () => Promise<void>;
  decline: () => void;
}

/** This browser's saved work, offered to the signed-in account. */
export function useLocalDataImport(): LocalDataImport {
  const backend = useAssociationBackend();
  const queryClient = useQueryClient();
  const available = backend.mode === 'api';
  const userId = backend.userId;

  const [pendingCount, setPendingCount] = useState(0);
  const [unsupportedCount, setUnsupportedCount] = useState(0);
  const [declined, setDeclined] = useState(false);
  const [state, setState] = useState<LocalImportState>('idle');
  const [summary, setSummary] = useState<LocalImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!available) {
      setPendingCount(0);
      setUnsupportedCount(0);
      setDeclined(false);
      return;
    }
    const plan = planLocalImport(userId);
    setPendingCount(plan.items.length);
    setUnsupportedCount(plan.unsupported.length);
    setDeclined(isImportDeclined(userId));
  }, [available, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = useCallback(async () => {
    if (backend.mode !== 'api') {
      return;
    }
    setState('running');
    setError(null);
    try {
      const result = await runLocalImport({ client: backend.client, userId: backend.userId });
      setSummary(result);
      setState('done');
      await Promise.all(
        [
          policyAssociationKeys.all,
          householdAssociationKeys.all,
          simulationAssociationKeys.all,
          reportAssociationKeys.all,
          ['reforms'],
          ['flagship-report-record'],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The import did not complete.');
      setState('error');
    } finally {
      refresh();
    }
  }, [backend, queryClient, refresh]);

  const decline = useCallback(() => {
    if (available) {
      declineImport(userId);
      setDeclined(true);
    }
  }, [available, userId]);

  return {
    available,
    pendingCount,
    unsupportedCount,
    declined,
    state,
    summary,
    error,
    run,
    decline,
  };
}
