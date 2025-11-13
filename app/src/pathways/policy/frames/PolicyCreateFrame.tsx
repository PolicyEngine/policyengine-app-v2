import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { PolicyState } from '../types';

interface PolicyCreateFrameProps {
  state: PolicyState;
  onStateChange: (newState: Partial<PolicyState>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

/**
 * PolicyCreateFrame is wrapped in a standard AppShell by PolicyPathwayWrapper.
 *
 * This frame does not manage its own layout - it's rendered inside the
 * AppShell.Main section provided by PolicyPathwayWrapper.
 */

export default function PolicyCreateFrame({
  state,
  onStateChange,
  onNext,
}: PolicyCreateFrameProps) {
  const formInputs = (
    <TextInput
      label="Policy title"
      placeholder="Policy name"
      value={state.label}
      onChange={(e) => onStateChange({ label: e.currentTarget.value })}
    />
  );

  const primaryAction = {
    label: 'Create a policy',
    onClick: onNext,
  };

  return <FlowView title="Create a policy" content={formInputs} primaryAction={primaryAction} />;
}
