import { Anchor } from '@mantine/core';
import { colors } from '@/designTokens';
import { LinkColumnConfig, LinkValue } from './types';
import PolicyLink from '@/components/common/PolicyLink';
import SimulationLink from '@/components/common/SimulationLink';
import DatasetLink from '@/components/common/DatasetLink';
import DynamicLink from '@/components/common/DynamicLink';
import ReportLink from '@/components/common/ReportLink';
import ModelVersionLink from '@/components/common/ModelVersionLink';

interface LinkColumnProps {
  config: LinkColumnConfig;
  value: LinkValue;
}

export function LinkColumn({ config, value }: LinkColumnProps) {
  // If resourceType is specified, use the dedicated link component
  if (config.resourceType && value.resourceId) {
    const label = value.text;
    const size = config.size || 'sm';

    switch (config.resourceType) {
      case 'policy':
        return <PolicyLink policyId={value.resourceId} label={label} size={size} />;
      case 'simulation':
        return <SimulationLink simulationId={value.resourceId} label={label} size={size} />;
      case 'dataset':
        return <DatasetLink datasetId={value.resourceId} label={label} size={size} />;
      case 'dynamic':
        return <DynamicLink dynamicId={value.resourceId} label={label} size={size} />;
      case 'report':
        return <ReportLink reportId={value.resourceId} label={label} size={size} />;
      case 'model-version':
        return <ModelVersionLink modelVersionId={value.resourceId} label={label} size={size} />;
    }
  }

  // Fall back to standard anchor for non-resource links
  return (
    <Anchor
      size={config.size || 'sm'}
      c={config.color || colors.blue[600]}
      href={value.url || `${config.urlPrefix || '#'}${value.text}`}
      td="none"
    >
      {value.text}
    </Anchor>
  );
}
