/**
 * PolicyPathwayWrapper - Pathway orchestrator for standalone policy creation
 *
 * Manages local state for a single policy with parameter modifications.
 * Reuses shared views from the report pathway with mode="standalone".
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PolicyStateProps } from '@/types/pathwayState';
import { PolicyViewMode } from '@/types/pathwayModes/PolicyViewMode';
import { initializePolicyState } from '@/utils/pathwayState/initializePolicyState';
import StandardLayout from '@/components/StandardLayout';
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

// Policy views (reusing from report pathway)
import PolicyLabelView from '../report/views/policy/PolicyLabelView';
import PolicyParameterSelectorView from '../report/views/policy/PolicyParameterSelectorView';
import PolicySubmitView from '../report/views/policy/PolicySubmitView';

// View modes that manage their own AppShell (don't need StandardLayout wrapper)
const MODES_WITH_OWN_LAYOUT = new Set([PolicyViewMode.PARAMETER_SELECTOR]);

interface PolicyPathwayWrapperProps {
  onComplete?: () => void;
}

export default function PolicyPathwayWrapper({ onComplete }: PolicyPathwayWrapperProps) {
  console.log('[PolicyPathwayWrapper] ========== RENDER ==========');

  const countryId = useCurrentCountry();
  const navigate = useNavigate();

  // Initialize policy state
  const [policyState, setPolicyState] = useState<PolicyStateProps>(() => {
    return initializePolicyState();
  });

  // ========== NAVIGATION ==========
  const { currentMode, navigateToMode } = usePathwayNavigation(PolicyViewMode.LABEL);

  // ========== CALLBACKS ==========
  const updateLabel = useCallback((label: string) => {
    setPolicyState((prev) => ({ ...prev, label }));
  }, []);

  const updatePolicy = useCallback((updatedPolicy: PolicyStateProps) => {
    setPolicyState(updatedPolicy);
  }, []);

  const handleSubmitSuccess = useCallback((policyId: string) => {
    console.log('[PolicyPathwayWrapper] Policy created with ID:', policyId);

    setPolicyState((prev) => ({
      ...prev,
      id: policyId,
    }));

    // Navigate back to policies list page
    navigate(`/${countryId}/policies`);

    if (onComplete) {
      onComplete();
    }
  }, [navigate, countryId, onComplete]);

  // ========== VIEW RENDERING ==========
  let currentView: React.ReactElement;

  switch (currentMode) {
    case PolicyViewMode.LABEL:
      currentView = (
        <PolicyLabelView
          label={policyState.label}
          mode="standalone"
          onUpdateLabel={updateLabel}
          onNext={() => navigateToMode(PolicyViewMode.PARAMETER_SELECTOR)}
          onCancel={() => navigate(`/${countryId}/policies`)}
        />
      );
      break;

    case PolicyViewMode.PARAMETER_SELECTOR:
      currentView = (
        <PolicyParameterSelectorView
          policy={policyState}
          onPolicyUpdate={updatePolicy}
          onNext={() => navigateToMode(PolicyViewMode.SUBMIT)}
          onBack={() => navigateToMode(PolicyViewMode.LABEL)}
        />
      );
      break;

    case PolicyViewMode.SUBMIT:
      currentView = (
        <PolicySubmitView
          policy={policyState}
          countryId={countryId}
          onSubmitSuccess={handleSubmitSuccess}
        />
      );
      break;

    default:
      currentView = <div>Unknown view mode: {currentMode}</div>;
  }

  // Conditionally wrap with StandardLayout
  // PolicyParameterSelectorView manages its own AppShell
  if (MODES_WITH_OWN_LAYOUT.has(currentMode as PolicyViewMode)) {
    return currentView;
  }

  return <StandardLayout>{currentView}</StandardLayout>;
}
