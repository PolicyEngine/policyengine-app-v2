/**
 * Hook for saving a shared report to user's localStorage
 *
 * When a user clicks "Save" on a shared report, this hook persists the
 * user associations from ReportIngredientsInput to localStorage, making the report
 * appear in their reports list.
 */

import { useCallback, useRef, useState } from 'react';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useCurrentLawId } from '@/hooks/useStaticMetadata';
import { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import { CountryId } from '@/libs/countries';
import { UserReport } from '@/types/ingredients/UserReport';
import { getShareDataUserReportId } from '@/utils/shareUtils';
import { useCreateGeographicAssociation } from './useUserGeographic';
import { useCreateHouseholdAssociation } from './useUserHousehold';
import { useCreatePolicyAssociation } from './useUserPolicy';
import { useCreateReportAssociation, useUserReportStore } from './useUserReportAssociations';
import { useCreateSimulationAssociation } from './useUserSimulationAssociations';

export type SaveResult = 'success' | 'partial' | 'already_saved' | null;

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
  const createReportAssociation = useCreateReportAssociation();
  const createSimulationAssociation = useCreateSimulationAssociation();
  const createPolicyAssociation = useCreatePolicyAssociation();
  const createHouseholdAssociation = useCreateHouseholdAssociation();
  const createGeographicAssociation = useCreateGeographicAssociation();
  const reportStore = useUserReportStore();

  // Get currentLawId from static metadata to skip creating associations for current law policies
  const countryId = useCurrentCountry();
  const currentLawId = useCurrentLawId(countryId);

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

  const saveSharedReport = async (shareData: ReportIngredientsInput): Promise<UserReport> => {
    const userId = 'anonymous'; // TODO: Replace with auth context
    const userReportId = getShareDataUserReportId(shareData);

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
      .map((policy) =>
        createPolicyAssociation.mutateAsync({
          userId,
          policyId: policy.policyId,
          countryId: policy.countryId as CountryId,
          label: policy.label ?? undefined,
        })
      );

    // Save households
    const householdPromises = shareData.userHouseholds.map((hh) =>
      createHouseholdAssociation.mutateAsync({
        userId,
        householdId: hh.householdId,
        countryId: hh.countryId as CountryId,
        label: hh.label ?? undefined,
      })
    );

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
