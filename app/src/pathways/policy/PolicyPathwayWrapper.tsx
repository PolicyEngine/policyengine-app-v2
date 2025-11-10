import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PolicyAdapter } from '@/adapters';
import { useCreatePolicy } from '@/hooks/useCreatePolicy';
import { Policy } from '@/types/ingredients/Policy';
import { PolicyCreationPayload } from '@/types/payloads';
import { PolicyDisplayMode, PolicyPathwayState } from './types';
import PolicyCreateFrame from './frames/PolicyCreateFrame';
import PolicyParameterFrame from './frames/PolicyParameterFrame';
import PolicySubmitFrame from './frames/PolicySubmitFrame';

export default function PolicyPathwayWrapper() {
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();

  const [mode, setMode] = useState<PolicyDisplayMode>(PolicyDisplayMode.CREATE);
  const [state, setState] = useState<PolicyPathwayState>({
    label: '',
    parameters: [],
    countryId: countryId || 'us',
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

  return (
    <>
      {mode === PolicyDisplayMode.CREATE && (
        <PolicyCreateFrame
          label={state.label}
          onLabelChange={(label) => setState({ ...state, label })}
          onNext={handleNext}
          onCancel={handleCancel}
        />
      )}

      {mode === PolicyDisplayMode.SELECT_PARAMETERS && (
        <PolicyParameterFrame
          parameters={state.parameters}
          countryId={state.countryId}
          onParametersChange={(parameters) => setState({ ...state, parameters })}
          onNext={handleNext}
          onBack={handleBack}
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
    </>
  );
}
