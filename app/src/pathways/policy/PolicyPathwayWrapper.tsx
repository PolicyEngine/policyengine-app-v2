/**
 * PolicyPathwayWrapper - Pathway orchestrator for standalone policy creation
 *
 * Manages local state for a single policy with parameter modifications.
 * Reuses shared views from the report pathway with mode="standalone".
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StandardLayout from '@/components/StandardLayout';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
import { PolicyViewMode } from '@/types/pathwayModes/PolicyViewMode';
import { PolicyStateProps } from '@/types/pathwayState';
import { createPolicyCallbacks } from '@/utils/pathwayCallbacks';
import { initializePolicyState } from '@/utils/pathwayState/initializePolicyState';
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
  const { currentMode, navigateToMode, goBack, canGoBack } = usePathwayNavigation(
    PolicyViewMode.LABEL
  );

  // ========== CALLBACKS ==========
  // Use shared callback factory with onPolicyComplete for standalone navigation
  const policyCallbacks = createPolicyCallbacks(
    setPolicyState,
    (state) => state, // policySelector: return the state itself (PolicyStateProps)
    (_state, policy) => policy, // policyUpdater: replace entire state with new policy
    navigateToMode,
    PolicyViewMode.SUBMIT, // returnMode (not used in standalone mode)
    (policyId: string) => {
      // onPolicyComplete: custom navigation for standalone pathway
      console.log('[PolicyPathwayWrapper] Policy created with ID:', policyId);
      navigate(`/${countryId}/policies`);
      onComplete?.();
    }
  );

  // ========== VIEW RENDERING ==========
  let currentView: React.ReactElement;

  switch (currentMode) {
    case PolicyViewMode.LABEL:
      currentView = (
        <PolicyLabelView
          label={policyState.label}
          mode="standalone"
          onUpdateLabel={policyCallbacks.updateLabel}
          onNext={() => navigateToMode(PolicyViewMode.PARAMETER_SELECTOR)}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/policies`)}
        />
      );
      break;

    case PolicyViewMode.PARAMETER_SELECTOR:
      currentView = (
        <PolicyParameterSelectorView
          policy={policyState}
          onPolicyUpdate={policyCallbacks.updatePolicy}
          onNext={() => navigateToMode(PolicyViewMode.SUBMIT)}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case PolicyViewMode.SUBMIT:
      currentView = (
        <PolicySubmitView
          policy={policyState}
          countryId={countryId}
          onSubmitSuccess={policyCallbacks.handleSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
          onCancel={() => navigate(`/${countryId}/policies`)}
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
