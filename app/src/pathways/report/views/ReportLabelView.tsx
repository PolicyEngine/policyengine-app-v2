import { useState } from 'react';
import { Select, TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';

interface ReportLabelViewProps {
  label: string | null;
  onUpdateLabel: (label: string) => void;
  onNext: () => void;
}

export default function ReportLabelView({ label, onUpdateLabel, onNext }: ReportLabelViewProps) {
  console.log('[ReportLabelView] ========== COMPONENT RENDER ==========');
  const [localLabel, setLocalLabel] = useState(label || '');
  // NOTE: Temporary hardcoded year dropdown - does nothing functionally, placeholder for future feature
  const [year, setYear] = useState<string>('2025');

  function handleLocalLabelChange(value: string) {
    setLocalLabel(value);
  }

  function submissionHandler() {
    console.log('[ReportLabelView] Submit clicked - label:', localLabel);
    onUpdateLabel(localLabel);
    console.log('[ReportLabelView] Navigating to next');
    onNext();
  }

  const formInputs = (
    <>
      <TextInput
        label="Report name"
        placeholder="Enter report name"
        value={localLabel}
        onChange={(e) => handleLocalLabelChange(e.currentTarget.value)}
      />
      {/* NOTE: Temporary hardcoded year dropdown - does nothing functionally */}
      <Select
        label="Year"
        placeholder="Select year"
        data={['2025']}
        value={year}
        onChange={(val) => setYear(val || '2025')}
        disabled
      />
    </>
  );

  const primaryAction = {
    label: 'Create report',
    onClick: submissionHandler,
  };

  return <FlowView title="Create report" content={formInputs} primaryAction={primaryAction} />;
}
