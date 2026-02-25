/**
 * V1-to-V2 Migration Hook
 *
 * Triggers automatic background migration of user association data
 * from localStorage to the v2 API on app startup.
 *
 * Wire this into the app by rendering <MigrationRunner /> inside
 * the QueryClientProvider (see CalculatorApp.tsx).
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUserId } from '@/hooks/useUserId';
import {
  hasLocalStorageData,
  isMigrationComplete,
  migrateV1AssociationsToV2,
} from '@/libs/v1Migration';

export function useV1Migration(): void {
  const userId = useUserId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isMigrationComplete()) {
      return;
    }
    if (!hasLocalStorageData()) {
      return;
    }

    migrateV1AssociationsToV2(userId)
      .then((success) => {
        if (success) {
          queryClient.invalidateQueries();
          console.info('[v1Migration] Migration complete, queries invalidated');
        }
      })
      .catch((err) => {
        console.error('[v1Migration] Migration failed:', err);
      });
  }, [userId, queryClient]);
}
