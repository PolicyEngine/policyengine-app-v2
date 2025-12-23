import { useState } from 'react';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { useCreateGeographicAssociation } from './useUserGeographic';
import { useCreateHouseholdAssociation } from './useUserHousehold';
import { useCreatePolicyAssociation } from './useUserPolicy';
import { useCreateReportAssociation } from './useUserReportAssociations';
import { useCreateSimulationAssociation } from './useUserSimulationAssociations';

export type SaveResult = 'success' | 'partial' | null;

interface SaveSharedReportParams {
  report: Report;
  simulations: Simulation[];
  policies: Policy[];
  households: Household[];
  geographies: Geography[];
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
 */
export function useSaveSharedReport() {
  const createReportAssociation = useCreateReportAssociation();
  const createSimulationAssociation = useCreateSimulationAssociation();
  const createPolicyAssociation = useCreatePolicyAssociation();
  const createHouseholdAssociation = useCreateHouseholdAssociation();
  const createGeographicAssociation = useCreateGeographicAssociation();

  const [saveResult, setSaveResult] = useState<SaveResult>(null);

  const saveSharedReport = async ({
    report,
    simulations,
    policies,
    households,
    geographies,
  }: SaveSharedReportParams) => {
    const userId = 'anonymous'; // TODO: Replace with auth context

    // Save all simulations
    const simPromises = simulations
      .filter((s) => s.id)
      .map((sim) =>
        createSimulationAssociation.mutateAsync({
          userId,
          simulationId: sim.id!,
          countryId: sim.countryId!,
          label: sim.label ?? undefined,
        })
      );

    // Save all policies
    const policyPromises = policies
      .filter((p) => p.id)
      .map((policy) =>
        createPolicyAssociation.mutateAsync({
          userId,
          policyId: policy.id!,
          countryId: policy.countryId!,
          label: policy.label ?? undefined,
        })
      );

    // Save households if present
    const householdPromises = households
      .filter((h) => h.id)
      .map((hh) =>
        createHouseholdAssociation.mutateAsync({
          userId,
          householdId: hh.id!,
          countryId: hh.countryId,
          label: undefined,
        })
      );

    // Save geographies if present
    const geographyPromises = geographies
      .filter((g) => g.id)
      .map((geo) =>
        createGeographicAssociation.mutateAsync({
          userId,
          geographyId: geo.geographyId,
          countryId: geo.countryId,
          scope: geo.scope,
          label: geo.name ?? undefined,
        })
      );

    // Run all in parallel, don't fail on individual errors
    const allResults = await Promise.allSettled([
      ...simPromises,
      ...policyPromises,
      ...householdPromises,
      ...geographyPromises,
    ]);

    // Generate timestamp-based label for saved shared reports
    const savedReportLabel = `Saved Report - ${new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;

    // Save report (this one is required)
    const newUserReport = await createReportAssociation.mutateAsync({
      userId,
      reportId: report.id!,
      countryId: report.countryId,
      label: report.label || savedReportLabel,
    });

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
