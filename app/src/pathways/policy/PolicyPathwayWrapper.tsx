/**
 * PolicyPathwayWrapper - Pathway orchestrator for standalone policy creation
 *
 * Manages local state for a single policy with parameter modifications.
 * Reuses shared views from the report pathway with mode="standalone".
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import StandardLayout from '@/components/StandardLayout';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { usePathwayNavigation } from '@/hooks/usePathwayNavigation';
import { StandalonePolicyViewMode } from '@/types/pathwayModes/PolicyViewMode';
import { PolicyStateProps } from '@/types/pathwayState';
import { createPolicyCallbacks } from '@/utils/pathwayCallbacks';
import { initializePolicyState } from '@/utils/pathwayState/initializePolicyState';
import { perfModeChange, perfMount } from '@/utils/perfHarness';
// Policy views (reusing from report pathway)
import PolicyLabelView from '../report/views/policy/PolicyLabelView';
import PolicyParameterSelectorView from '../report/views/policy/PolicyParameterSelectorView';
import PolicySubmitView from '../report/views/policy/PolicySubmitView';

// View modes that manage their own AppShell (don't need StandardLayout wrapper)
const MODES_WITH_OWN_LAYOUT = new Set([StandalonePolicyViewMode.PARAMETER_SELECTOR]);

interface PolicyPathwayWrapperProps {
  onComplete?: () => void;
}

export default function PolicyPathwayWrapper({ onComplete }: PolicyPathwayWrapperProps) {
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();

  // [PERF HARNESS]
  useEffect(() => perfMount('PolicyPathwayWrapper'), []);

  const handleCancel = useCallback(() => {
    nav.push(`/${countryId}/policies`);
  }, [nav, countryId]);

  // Initialize policy state
  const [policyState, setPolicyState] = useState<PolicyStateProps>(() => {
    return initializePolicyState();
  });

  // ========== NAVIGATION ==========
  const { currentMode, navigateToMode, goBack, canGoBack } = usePathwayNavigation(
    StandalonePolicyViewMode.LABEL
  );

  // [PERF HARNESS] Track mode changes
  const prevMode = useRef(currentMode);
  useEffect(() => {
    if (prevMode.current !== currentMode) {
      perfModeChange('PolicyPathway', prevMode.current, currentMode);
      prevMode.current = currentMode;
    }
  }, [currentMode]);

  // ========== CALLBACKS ==========
  // Use shared callback factory with onPolicyComplete for standalone navigation
  const policyCallbacks = createPolicyCallbacks(
    setPolicyState,
    (state) => state, // policySelector: return the state itself (PolicyStateProps)
    (_state, policy) => policy, // policyUpdater: replace entire state with new policy
    navigateToMode,
    StandalonePolicyViewMode.SUBMIT, // returnMode (not used in standalone mode)
    (_policyId: string) => {
      // onPolicyComplete: custom navigation for standalone pathway
      nav.push(`/${countryId}/policies`);
      onComplete?.();
    }
  );

  // Redirect to listing page on unknown view mode
  const isValidMode = Object.values(StandalonePolicyViewMode).includes(
    currentMode as StandalonePolicyViewMode
  );
  useEffect(() => {
    if (!isValidMode) {
      console.error(`[PolicyPathwayWrapper] Unknown view mode: ${currentMode}`);
      nav.push(`/${countryId}/policies`);
    }
  }, [isValidMode, currentMode, nav, countryId]);

  // ========== VIEW RENDERING ==========
  let currentView: React.ReactElement;

  switch (currentMode) {
    case StandalonePolicyViewMode.LABEL:
      currentView = (
        <PolicyLabelView
          label={policyState.label}
          mode="standalone"
          onUpdateLabel={policyCallbacks.updateLabel}
          onNext={() => navigateToMode(StandalonePolicyViewMode.PARAMETER_SELECTOR)}
          onBack={canGoBack ? goBack : undefined}
          onCancel={handleCancel}
        />
      );
      break;

    case StandalonePolicyViewMode.PARAMETER_SELECTOR:
      currentView = (
        <PolicyParameterSelectorView
          policy={policyState}
          onPolicyUpdate={policyCallbacks.updatePolicy}
          onNext={() => navigateToMode(StandalonePolicyViewMode.SUBMIT)}
          onBack={canGoBack ? goBack : undefined}
        />
      );
      break;

    case StandalonePolicyViewMode.SUBMIT:
      currentView = (
        <PolicySubmitView
          policy={policyState}
          countryId={countryId}
          onSubmitSuccess={policyCallbacks.handleSubmitSuccess}
          onBack={canGoBack ? goBack : undefined}
          onCancel={handleCancel}
        />
      );
      break;

    default:
      currentView = <></>;
  }

  // Conditionally wrap with StandardLayout
  // PolicyParameterSelectorView manages its own AppShell
  if (MODES_WITH_OWN_LAYOUT.has(currentMode as StandalonePolicyViewMode)) {
    return currentView;
  }

  return <StandardLayout>{currentView}</StandardLayout>;
}
