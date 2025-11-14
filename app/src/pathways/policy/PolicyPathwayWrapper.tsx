import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { PolicyAdapter } from '@/adapters';
import { CountryId } from '@/api/report';
import HeaderNavigation from '@/components/shared/HomeHeader';
import LegacyBanner from '@/components/shared/LegacyBanner';
import Sidebar from '@/components/Sidebar';
import { spacing } from '@/designTokens';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { Policy } from '@/types/ingredients/Policy';
import { PolicyCreationPayload } from '@/types/payloads';
import { POLICY_PATHWAY_CONFIG } from './config';
import { PolicyState, PolicyViewKey } from './types';
import { POLICY_VIEWS } from './views';

/**
 * PolicyPathwayWrapper manages the policy creation pathway.
 *
 * IMPORTANT: This component is NOT rendered inside Layout. It manages its own
 * AppShell switching to avoid re-render loops that occur when trying to use
 * context or URL state to communicate layout mode to a parent Layout component.
 *
 * This wrapper uses the pathway configuration system:
 * - POLICY_VIEWS: Defines the individual view components and their layout requirements
 * - POLICY_PATHWAY_CONFIG: Defines the navigation flow between views
 *
 * When a view's layoutType is 'custom', the view component renders with its own
 * AppShell. For 'standard' layout views, this wrapper provides the AppShell.
 *
 * This approach duplicates some AppShell code from Layout, but avoids the
 * fundamental issue where any state change in a parent causes child components
 * to re-mount, resetting the pathway state.
 */
export default function PolicyPathwayWrapper() {
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();

  const [currentView, setCurrentView] = useState<PolicyViewKey>(POLICY_PATHWAY_CONFIG.initialView);
  const [state, setState] = useState<PolicyState>({
    label: '',
    parameters: [],
    countryId: (countryId as CountryId) || 'us',
    position: 0,
  });

  const { createPolicy, isPending } = useCreatePolicy(state.label);

  // Get current view configuration
  const view = POLICY_VIEWS[currentView];
  const transitions = POLICY_PATHWAY_CONFIG.transitions[currentView];

  const handleNext = () => {
    // Check if we can proceed (validation)
    if (view.canProceed && !view.canProceed(state)) {
      return;
    }

    if (transitions?.next) {
      // Handle dynamic transitions (functions)
      const nextView = typeof transitions.next === 'function' ? transitions.next(state) : transitions.next;
      setCurrentView(nextView);
    } else {
      // End of pathway - submit
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (transitions?.back) {
      // Handle dynamic transitions (functions)
      const backView = typeof transitions.back === 'function' ? transitions.back(state) : transitions.back;
      setCurrentView(backView);
    }
  };

  const handleStateChange = (newState: Partial<PolicyState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const handleCancel = () => {
    navigate(`/${countryId}/policies`);
  };

  const handleSubmit = () => {
    const policy: Partial<Policy> = {
      parameters: state.parameters,
    };

    const payload: PolicyCreationPayload = PolicyAdapter.toCreationPayload(policy as Policy);

    createPolicy(payload, {
      onSuccess: (data) => {
        console.log('Policy created successfully:', data);
        navigate(`/${countryId}/policies`);
      },
      onError: (error) => {
        console.error('Failed to create policy:', error);
      },
    });
  };

  const ViewComponent = view.component;
  const layoutType = view.layoutType || 'standard'; // Default to standard if not specified

  // Custom layout - view component manages its own AppShell
  if (layoutType === 'custom') {
    return (
      <ViewComponent
        state={state}
        onStateChange={handleStateChange}
        onNext={handleNext}
        onBack={handleBack}
        onCancel={handleCancel}
      />
    );
  }

  // Standard layout - wrap view in AppShell
  return (
    <AppShell
      layout="default"
      header={{ height: parseInt(spacing.appShell.header.height, 10) }}
      navbar={{
        width: parseInt(spacing.appShell.navbar.width, 10),
        breakpoint: spacing.appShell.navbar.breakpoint,
      }}
    >
      <AppShell.Header p={0}>
        <HeaderNavigation />
        <LegacyBanner />
      </AppShell.Header>

      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        <ViewComponent
          state={state}
          onStateChange={handleStateChange}
          onNext={handleNext}
          onBack={handleBack}
          onCancel={handleCancel}
        />
      </AppShell.Main>
    </AppShell>
  );
}
