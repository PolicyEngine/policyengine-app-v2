import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { ShareData } from '@/utils/shareUtils';
import { useCreateGeographicAssociation } from './useUserGeographic';
import { useCreateHouseholdAssociation } from './useUserHousehold';
import { useCreatePolicyAssociation } from './useUserPolicy';
import { useCreateReportAssociation, useUserReportStore } from './useUserReportAssociations';
import { useCreateSimulationAssociation } from './useUserSimulationAssociations';

export type SaveResult = 'success' | 'partial' | 'already_saved' | null;

interface SaveSharedReportParams {
  report: Report;
  simulations: Simulation[];
  policies: Policy[];
  households: Household[];
  geographies: Geography[];
  shareData?: ShareData | null;
}

/**
 * Hook for saving a shared report and all its ingredients to user associations
 *
 * Creates associations for:
 * - Report
 * - Simulations
 * - Policies
 * - Households (if present)
 * - Geographies (if present)
 *
 * Uses Promise.allSettled for best-effort saving of ingredients.
 * Report save is required; ingredient saves are optional.
 *
 * If shareData is provided, performs idempotent save:
 * - Checks if userReportId already exists
 * - If exists, returns existing report without creating duplicates
 * - Uses labels from shareData for exact UI reproduction
 */
export function useSaveSharedReport() {
  const createReportAssociation = useCreateReportAssociation();
  const createSimulationAssociation = useCreateSimulationAssociation();
  const createPolicyAssociation = useCreatePolicyAssociation();
  const createHouseholdAssociation = useCreateHouseholdAssociation();
  const createGeographicAssociation = useCreateGeographicAssociation();
  const reportStore = useUserReportStore();

  // Get currentLawId to skip creating associations for current law policies
  // (current law is a pre-defined policy, not user-created)
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);

  const [saveResult, setSaveResult] = useState<SaveResult>(null);

  const saveSharedReport = async ({
    report,
    simulations,
    policies,
    households,
    geographies,
    shareData,
  }: SaveSharedReportParams) => {
    const userId = 'anonymous'; // TODO: Replace with auth context

    // Idempotency check: if shareData has userReportId, check if it already exists
    if (shareData?.userReportId) {
      const existingReport = await reportStore.findByUserReportId(shareData.userReportId);
      if (existingReport) {
        // Report already saved - don't create duplicates
        setSaveResult('already_saved');
        setTimeout(() => setSaveResult(null), 3000);
        return existingReport;
      }
    }

    // Get labels from shareData if available (for exact UI reproduction)
    const getSimulationLabel = (simId: string, index: number): string | undefined => {
      if (shareData?.simulationLabels?.[index] !== undefined) {
        return shareData.simulationLabels[index] ?? undefined;
      }
      const sim = simulations.find((s) => String(s.id) === simId);
      return sim?.label ?? undefined;
    };

    const getPolicyLabel = (policyId: string, index: number): string | undefined => {
      if (shareData?.policyLabels?.[index] !== undefined) {
        return shareData.policyLabels[index] ?? undefined;
      }
      const policy = policies.find((p) => String(p.id) === policyId);
      return policy?.label ?? undefined;
    };

    // Save all simulations with labels from shareData
    const simPromises = simulations
      .filter((s) => s.id)
      .map((sim, index) =>
        createSimulationAssociation.mutateAsync({
          userId,
          simulationId: sim.id!,
          countryId: sim.countryId!,
          label: getSimulationLabel(String(sim.id), index),
        })
      );

    // Save all policies with labels from shareData
    // Skip current law policies - they're pre-defined, not user-created
    const policyPromises = policies
      .filter((p) => p.id && String(p.id) !== String(currentLawId))
      .map((policy, index) =>
        createPolicyAssociation.mutateAsync({
          userId,
          policyId: policy.id!,
          countryId: policy.countryId!,
          label: getPolicyLabel(String(policy.id), index),
        })
      );

    // Save households if present (with label from shareData)
    const householdPromises = households
      .filter((h) => h.id)
      .map((hh) =>
        createHouseholdAssociation.mutateAsync({
          userId,
          householdId: hh.id!,
          countryId: hh.countryId,
          label: shareData?.householdLabel ?? undefined,
        })
      );

    // Save geographies if present (with label from shareData)
    const geographyPromises = geographies
      .filter((g) => g.id)
      .map((geo) =>
        createGeographicAssociation.mutateAsync({
          userId,
          geographyId: geo.geographyId,
          countryId: geo.countryId,
          scope: geo.scope,
          label: shareData?.geographyLabel ?? geo.name ?? undefined,
        })
      );

    // Run all in parallel, don't fail on individual errors
    const allResults = await Promise.allSettled([
      ...simPromises,
      ...policyPromises,
      ...householdPromises,
      ...geographyPromises,
    ]);

    // Use label from shareData, or generate timestamp-based label for saved shared reports
    const savedReportLabel =
      shareData?.reportLabel ??
      report.label ??
      `Saved Report - ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;

    // Save report (this one is required)
    // If shareData has userReportId, use it (idempotent save with sharer's ID)
    // Otherwise, generate a new ID via createReportAssociation
    let newUserReport;
    if (shareData?.userReportId) {
      newUserReport = await reportStore.createWithId({
        id: shareData.userReportId,
        userId,
        reportId: String(report.id!),
        countryId: report.countryId,
        label: savedReportLabel,
      });
    } else {
      newUserReport = await createReportAssociation.mutateAsync({
        userId,
        reportId: report.id!,
        countryId: report.countryId,
        label: savedReportLabel,
      });
    }

    // Check if any ingredient saves failed
    const hasFailures = allResults.some((r) => r.status === 'rejected');
    setSaveResult(hasFailures ? 'partial' : 'success');
    setTimeout(() => setSaveResult(null), 3000);

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
