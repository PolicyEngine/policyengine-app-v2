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
import { PolicyDisplayMode, PolicyPathwayState } from './types';
import PolicyCreateFrame from './frames/PolicyCreateFrame';
import PolicyParameterFrame from './frames/PolicyParameterFrame';
import PolicySubmitFrame from './frames/PolicySubmitFrame';

/**
 * PolicyPathwayWrapper manages the policy creation pathway.
 *
 * IMPORTANT: This component is NOT rendered inside Layout. It manages its own
 * AppShell switching to avoid re-render loops that occur when trying to use
 * context or URL state to communicate layout mode to a parent Layout component.
 *
 * When mode is SELECT_PARAMETERS, PolicyParameterFrame renders with its own
 * custom AppShell. For CREATE and SUBMIT modes, we wrap those frames in a
 * standard AppShell here.
 *
 * This approach duplicates some AppShell code from Layout, but avoids the
 * fundamental issue where any state change in a parent causes child components
 * to re-mount, resetting the pathway state.
 */
export default function PolicyPathwayWrapper() {
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();

  const [mode, setMode] = useState<PolicyDisplayMode>(PolicyDisplayMode.CREATE);
  const [state, setState] = useState<PolicyPathwayState>({
    label: '',
    parameters: [],
    countryId: (countryId as CountryId) || 'us',
    position: 0,
  });

  const { createPolicy, isPending } = useCreatePolicy(state.label);

  const handleNext = () => {
    if (mode === PolicyDisplayMode.CREATE) {
      setMode(PolicyDisplayMode.SELECT_PARAMETERS);
    } else if (mode === PolicyDisplayMode.SELECT_PARAMETERS) {
      setMode(PolicyDisplayMode.SUBMIT);
    }
  };

  const handleBack = () => {
    if (mode === PolicyDisplayMode.SELECT_PARAMETERS) {
      setMode(PolicyDisplayMode.CREATE);
    } else if (mode === PolicyDisplayMode.SUBMIT) {
      setMode(PolicyDisplayMode.SELECT_PARAMETERS);
    }
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

  // PolicyParameterFrame has its own custom AppShell, render it directly
  if (mode === PolicyDisplayMode.SELECT_PARAMETERS) {
    return (
      <PolicyParameterFrame
        label={state.label}
        parameters={state.parameters}
        onParametersChange={(parameters) => setState({ ...state, parameters })}
        onNext={handleNext}
        onBack={handleBack}
      />
    );
  }

  // For CREATE and SUBMIT modes, wrap in standard AppShell
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
        {mode === PolicyDisplayMode.CREATE && (
          <PolicyCreateFrame
            label={state.label}
            onLabelChange={(label) => setState({ ...state, label })}
            onNext={handleNext}
            onCancel={handleCancel}
          />
        )}

        {mode === PolicyDisplayMode.SUBMIT && (
          <PolicySubmitFrame
            label={state.label}
            parameters={state.parameters}
            countryId={state.countryId}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isPending}
          />
        )}
      </AppShell.Main>
    </AppShell>
  );
}
