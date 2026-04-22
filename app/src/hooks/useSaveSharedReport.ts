/**
 * Hook for saving a shared report to user's localStorage
 *
 * When a user clicks "Save" on a shared report, this hook persists the
 * user associations from ReportIngredientsInput to localStorage, making the report
 * appear in their reports list.
 */

import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import { assertSupportedMode, usesV2ShadowMode } from '@/config/migrationMode';
import { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import { CountryId } from '@/libs/countries';
import {
  shadowCreateHouseholdAndAssociation,
  shadowCreateUserHouseholdAssociation,
} from '@/libs/migration/householdShadow';
import { getV2Id } from '@/libs/migration/idMapping';
import { logMigrationConsole } from '@/libs/migration/migrationLogRuntime';
import { sendMigrationLog } from '@/libs/migration/migrationLogTransport';
import {
  shadowCreatePolicyAndAssociation,
  shadowCreateUserPolicyAssociation,
} from '@/libs/migration/policyShadow';
import { Household } from '@/models/Household';
import type { AppHouseholdInputEnvelope } from '@/models/household/appTypes';
import { RootState } from '@/store';
import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { getShareDataUserReportId } from '@/utils/shareUtils';
import { useCreateGeographicAssociation } from './useUserGeographic';
import { useCreateHouseholdAssociation } from './useUserHousehold';
import { useCreatePolicyAssociation } from './useUserPolicy';
import { useCreateReportAssociation, useUserReportStore } from './useUserReportAssociations';
import { useCreateSimulationAssociation } from './useUserSimulationAssociations';

export type SaveResult = 'success' | 'partial' | 'already_saved' | null;
type SharedSaveHouseholdDetails = AppHouseholdInputEnvelope | Household;

function shadowSavedPolicyAssociation(association: UserPolicy, policyDetails?: Policy): void {
  const mappedV2PolicyId = getV2Id('Policy', association.policyId);

  if (mappedV2PolicyId) {
    void shadowCreateUserPolicyAssociation(association, mappedV2PolicyId);
    return;
  }

  if (!policyDetails) {
    logMigrationConsole(
      '[PolicyMigration] Shared save missing policy details; skipping shadow v2 policy create:',
      association.policyId
    );
    sendMigrationLog({
      kind: 'event',
      prefix: 'PolicyMigration',
      operation: 'CREATE',
      status: 'SKIPPED',
      message: 'Shared save missing policy details; skipping shadow v2 policy create',
      metadata: {
        policyId: association.policyId,
        countryId: association.countryId,
      },
      ts: new Date().toISOString(),
    });
    return;
  }

  void shadowCreatePolicyAndAssociation({
    countryId: association.countryId,
    label: association.label,
    v1PolicyId: association.policyId,
    v1PolicyPayload: PolicyAdapter.toCreationPayload({
      ...policyDetails,
      label: association.label ?? policyDetails.label ?? null,
    }),
    v1Association: association,
  });
}

function shadowSavedHouseholdAssociation(
  association: UserHouseholdPopulation,
  householdDetails?: SharedSaveHouseholdDetails
): void {
  const mappedV2HouseholdId = getV2Id('Household', association.householdId);

  if (mappedV2HouseholdId) {
    void shadowCreateUserHouseholdAssociation(association, mappedV2HouseholdId);
    return;
  }

  if (!householdDetails) {
    logMigrationConsole(
      '[HouseholdMigration] Shared save missing household details; skipping shadow v2 household create:',
      association.householdId
    );
    sendMigrationLog({
      kind: 'event',
      prefix: 'HouseholdMigration',
      operation: 'CREATE',
      status: 'SKIPPED',
      message: 'Shared save missing household details; skipping shadow v2 household create',
      metadata: {
        householdId: association.householdId,
        countryId: association.countryId,
      },
      ts: new Date().toISOString(),
    });
    return;
  }

  const v1Household =
    householdDetails instanceof Household
      ? householdDetails
          .withId(association.householdId)
          .withLabel(association.label ?? householdDetails.label ?? null)
      : Household.fromAppInput({
          ...householdDetails,
          id: association.householdId,
          label: association.label ?? householdDetails.label ?? null,
        });

  void shadowCreateHouseholdAndAssociation({
    v1HouseholdId: association.householdId,
    v1Household,
    v1Association: association,
  });
}

/**
 * Hook for saving a shared report and all its user associations to localStorage
 *
 * ReportIngredientsInput already contains user associations with IDs and labels.
 * This hook simply persists them to localStorage.
 *
 * Features:
 * - Idempotent save using userReportId (won't create duplicates)
 * - Best-effort saving of ingredients (report save required, others optional)
 * - Skips current law policies (they're pre-defined, not user-created)
 */
export function useSaveSharedReport() {
  const policyWriteMode = assertSupportedMode(
    'policies',
    ['v1_only', 'v1_primary_v2_shadow'],
    'useSaveSharedReport'
  );
  const shouldShadowPolicies = usesV2ShadowMode(policyWriteMode);
  const createReportAssociation = useCreateReportAssociation();
  const createSimulationAssociation = useCreateSimulationAssociation();
  const createPolicyAssociation = useCreatePolicyAssociation({ skipV2AssociationShadow: true });
  const createHouseholdAssociation = useCreateHouseholdAssociation();
  const createGeographicAssociation = useCreateGeographicAssociation();
  const reportStore = useUserReportStore();

  // Get currentLawId to skip creating associations for current law policies
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

  const [saveResult, setSaveResult] = useState<SaveResult>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear previous timeout before setting new one
  const setResultWithTimeout = useCallback((result: SaveResult) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setSaveResult(result);
    timeoutRef.current = setTimeout(() => setSaveResult(null), 3000);
  }, []);

  const saveSharedReport = async (
    shareData: ReportIngredientsInput,
    policies: Policy[] = [],
    households: SharedSaveHouseholdDetails[] = []
  ): Promise<UserReport> => {
    const userId = 'anonymous'; // TODO: Replace with auth context
    const userReportId = getShareDataUserReportId(shareData);
    const policiesById = new Map(policies.map((policy) => [String(policy.id), policy]));
    const householdsById = new Map(
      households.map((household) => [String(household.id), household])
    );

    // Idempotency check: see if this report is already saved
    const existingReport = await reportStore.findByUserReportId(userReportId);
    if (existingReport) {
      setResultWithTimeout('already_saved');
      return existingReport;
    }

    // Save simulations (labels from shareData)
    const simPromises = shareData.userSimulations.map((sim) =>
      createSimulationAssociation.mutateAsync({
        userId,
        simulationId: sim.simulationId,
        countryId: sim.countryId as CountryId,
        label: sim.label ?? undefined,
      })
    );

    // Save policies (skip current law - it's pre-defined)
    const policyPromises = shareData.userPolicies
      .filter((p) => String(p.policyId) !== String(currentLawId))
      .map(async (policy) => {
        const association = await createPolicyAssociation.mutateAsync({
          userId,
          policyId: policy.policyId,
          countryId: policy.countryId as CountryId,
          label: policy.label ?? undefined,
        });

        if (shouldShadowPolicies) {
          shadowSavedPolicyAssociation(association, policiesById.get(String(policy.policyId)));
        }
        return association;
      });

    // Save households
    const householdPromises = shareData.userHouseholds.map(async (hh) => {
      const association = await createHouseholdAssociation.mutateAsync({
        userId,
        householdId: hh.householdId,
        countryId: hh.countryId as CountryId,
        label: hh.label ?? undefined,
      });

      shadowSavedHouseholdAssociation(association, householdsById.get(String(hh.householdId)));
      return association;
    });

    // Save geographies
    const geographyPromises = shareData.userGeographies.map((geo) =>
      createGeographicAssociation.mutateAsync({
        userId,
        geographyId: geo.geographyId,
        countryId: geo.countryId as CountryId,
        scope: geo.scope,
        label: geo.label ?? undefined,
      })
    );

    // Run all ingredient saves in parallel (best-effort)
    const allResults = await Promise.allSettled([
      ...simPromises,
      ...policyPromises,
      ...householdPromises,
      ...geographyPromises,
    ]);

    // Save the report (required)
    // Use the userReportId from shareData for idempotent save
    const reportLabel =
      shareData.userReport.label ??
      `Saved Report - ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

    let newUserReport: UserReport;
    try {
      // Use createReportAssociation with id for idempotent save
      newUserReport = await createReportAssociation.mutateAsync({
        id: userReportId,
        userId,
        reportId: shareData.userReport.reportId,
        countryId: shareData.userReport.countryId as CountryId,
        label: reportLabel,
      });
    } catch (error) {
      // Handle race condition: if another save completed first
      const existingAfterRace = await reportStore.findByUserReportId(userReportId);
      if (existingAfterRace) {
        setResultWithTimeout('already_saved');
        return existingAfterRace;
      }
      throw error;
    }

    // Check if any ingredient saves failed
    const hasFailures = allResults.some((r) => r.status === 'rejected');
    setResultWithTimeout(hasFailures ? 'partial' : 'success');

    return newUserReport;
  };

  const isPending =
    createReportAssociation.isPending ||
    createSimulationAssociation.isPending ||
    createPolicyAssociation.isPending ||
    createHouseholdAssociation.isPending ||
    createGeographicAssociation.isPending;

  return {
    saveSharedReport,
    saveResult,
    setSaveResult,
    isPending,
  };
}
