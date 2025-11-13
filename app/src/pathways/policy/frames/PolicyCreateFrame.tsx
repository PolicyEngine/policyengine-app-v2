import { TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';

interface PolicyCreateFrameProps {
  label: string;
  onLabelChange: (label: string) => void;
  onNext: () => void;
  onCancel: () => void;
}

/**
 * PolicyCreateFrame is wrapped in a standard AppShell by PolicyPathwayWrapper.
 *
 * This frame does not manage its own layout - it's rendered inside the
 * AppShell.Main section provided by PolicyPathwayWrapper.
 */

export default function PolicyCreateFrame({
  label,
  onLabelChange,
  onNext,
}: PolicyCreateFrameProps) {
  const formInputs = (
    <TextInput
      label="Policy title"
      placeholder="Policy name"
      value={label}
      onChange={(e) => onLabelChange(e.currentTarget.value)}
    />
  );

  const primaryAction = {
    label: 'Create a policy',
    onClick: onNext,
  };

  return <FlowView title="Create a policy" content={formInputs} primaryAction={primaryAction} />;
}
