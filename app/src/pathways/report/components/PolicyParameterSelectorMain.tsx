/**
 * PolicyParameterSelectorMain - Props-based version of Main component
 * Duplicated from components/policyParameterSelectorFrame/Main.tsx
 * Manages parameter display and modification without Redux
 */

import { Container, Title } from '@/components/ui';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { getParameterByName } from '@/types/subIngredients/parameter';
import { ValueIntervalCollection, ValuesList } from '@/types/subIngredients/valueInterval';
import { capitalize } from '@/utils/stringUtils';
import HistoricalValues from './policyParameterSelector/HistoricalValues';
import PolicyParameterSelectorValueSetter from './PolicyParameterSelectorValueSetter';

interface PolicyParameterSelectorMainProps {
  param: ParameterMetadata;
  policy: PolicyStateProps;
  onPolicyUpdate: (updatedPolicy: PolicyStateProps) => void;
}

export default function PolicyParameterSelectorMain({
  param,
  policy,
  onPolicyUpdate,
}: PolicyParameterSelectorMainProps) {
  const baseValues = new ValueIntervalCollection(param.values as ValuesList);

  // Always start reform with a copy of base values (reform line matches current law initially)
  const reformValues = new ValueIntervalCollection(baseValues);
  let policyLabel = null;
  let policyId = null;

  // If a policy exists, get metadata and check for user-defined parameter values
  if (policy) {
    policyLabel = policy.label;
    policyId = policy.id;

    // Check if this specific parameter has been modified by the user
    const paramToChart = getParameterByName(policy, param.parameter);
    if (paramToChart && paramToChart.values && paramToChart.values.length > 0) {
      // Don't replace - instead, overlay user intervals on top of base values
      const userIntervals = new ValueIntervalCollection(paramToChart.values as ValuesList);

      // Add each user interval to the reform (which already contains base values)
      // addInterval() will properly handle overlaps and merge/split intervals as needed
      for (const interval of userIntervals.getIntervals()) {
        reformValues.addInterval(interval);
      }
    }
    // If no values for this parameter yet, reformValues stays as baseValues (set above)
  }

  return (
    <Container variant="guttered">
      <Title order={3} className="tw:pb-xl">
        {capitalize(param.label || 'Label unavailable')}
      </Title>
      {param.description && (
        <>
          <p className="tw:font-semibold tw:pb-xs">Description</p>
          <p className="tw:pb-sm">{param.description}</p>
        </>
      )}
      <PolicyParameterSelectorValueSetter
        param={param}
        policy={policy}
        onPolicyUpdate={onPolicyUpdate}
      />
      <HistoricalValues
        param={param}
        baseValues={baseValues}
        reformValues={reformValues}
        policyLabel={policyLabel}
        policyId={policyId}
      />
    </Container>
  );
}
