import { useState } from 'react';
import { IconCircleMinus, IconCirclePlus, IconTriangleFilled } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { ActionIcon, Box, Group, Text } from '@mantine/core';
import { spacing, typography } from '@/designTokens';
import { useReportYear } from '@/hooks/useReportYear';
import { RootState } from '@/store';
import { Household } from '@/types/ingredients/Household';
import { calculateVariableComparison } from '@/utils/householdComparison';
import { getDisplayStyleConfig } from '@/utils/householdDisplayStyles';
import { getVariableDisplayText } from '@/utils/householdDisplayText';
import {
  formatVariableValue,
  getParameterAtInstant,
  shouldShowVariable,
} from '@/utils/householdValues';

interface VariableArithmeticProps {
  variableName: string;
  baseline: Household;
  reform: Household | null;
  isAdd: boolean;
  defaultExpanded?: boolean;
  childrenOnly?: boolean;
}

/**
 * Recursive component that renders a variable and its children
 * Supports both single mode (baseline only) and comparison mode (baseline vs reform)
 *
 * Based on the v1 app's VariableArithmetic component
 */
export default function VariableArithmetic({
  variableName,
  baseline,
  reform,
  isAdd,
  defaultExpanded = false,
  childrenOnly = false,
}: VariableArithmeticProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const reportYear = useReportYear();
  const metadata = useSelector((state: RootState) => state.metadata);

  const variable = metadata.variables[variableName];
  if (!variable) {
    return null;
  }

  // Calculate comparison (handles both single and comparison modes)
  const isComparisonMode = reform !== null;
  const comparison = calculateVariableComparison(variableName, baseline, reform, metadata);

  // Get child variables (adds and subtracts)
  let addsArray: string[] = [];
  let subtractsArray: string[] = [];

  if (variable.adds) {
    if (typeof variable.adds === 'string') {
      // It's a parameter name - resolve it
      const parameter = metadata.parameters[variable.adds];
      if (parameter) {
        addsArray = getParameterAtInstant(parameter, `${reportYear}-01-01`) || [];
      }
    } else if (Array.isArray(variable.adds)) {
      addsArray = variable.adds;
    }
  }

  if (variable.subtracts) {
    if (typeof variable.subtracts === 'string') {
      // It's a parameter name - resolve it
      const parameter = metadata.parameters[variable.subtracts];
      if (parameter) {
        subtractsArray = getParameterAtInstant(parameter, `${reportYear}-01-01`) || [];
      }
    } else if (Array.isArray(variable.subtracts)) {
      subtractsArray = variable.subtracts;
    }
  }

  // Filter child variables to only show non-zero ones
  const visibleAdds = addsArray.filter((v) =>
    shouldShowVariable(v, baseline, reform, metadata, false)
  );
  const visibleSubtracts = subtractsArray.filter((v) =>
    shouldShowVariable(v, baseline, reform, metadata, false)
  );

  // Recursively render children
  const childAddNodes = visibleAdds.map((childVar) => (
    <VariableArithmetic
      key={childVar}
      variableName={childVar}
      baseline={baseline}
      reform={reform}
      isAdd={isAdd} // Children of additions keep the same sign
      defaultExpanded={false}
    />
  ));

  const childSubtractNodes = visibleSubtracts.map((childVar) => (
    <VariableArithmetic
      key={childVar}
      variableName={childVar}
      baseline={baseline}
      reform={reform}
      isAdd={!isAdd} // Children of subtractions flip the sign
      defaultExpanded={false}
    />
  ));

  const childNodes = [...childAddNodes, ...childSubtractNodes];
  const expandable = childNodes.length > 0;

  // If childrenOnly, just render the children without the parent node
  if (childrenOnly) {
    return <>{childNodes}</>;
  }

  // Get display text and style configuration
  const displayText = getVariableDisplayText(variable.label, comparison, isComparisonMode);
  const styleConfig = getDisplayStyleConfig(isComparisonMode, comparison.direction, isAdd);

  // Create arrow element based on configuration (hide if no change)
  const showArrow = comparison.direction !== 'no-change';
  const Arrow = showArrow ? (
    <IconTriangleFilled
      size={14}
      style={{
        color: styleConfig.arrowColor,
        transform: styleConfig.arrowDirection === 'down' ? 'rotate(180deg)' : undefined,
      }}
    />
  ) : null;

  return (
    <Box>
      <Box
        p={spacing.md}
        onClick={() => expandable && setExpanded(!expanded)}
        style={{
          borderLeft: `3px solid ${styleConfig.borderColor}`,
          paddingLeft: spacing.lg,
          cursor: expandable ? 'pointer' : 'default',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (expandable) {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Group justify="space-between" align="center">
          <Group gap={spacing.sm}>
            <Text size="md" fw={typography.fontWeight.normal} c="dimmed">
              {displayText}
            </Text>
            {Arrow}
            <Text size="md" fw={typography.fontWeight.semibold} c={styleConfig.valueColor}>
              {formatVariableValue(variable, comparison.displayValue, 0)}
            </Text>
          </Group>
          {expandable && (
            <ActionIcon variant="subtle" color="gray" size="sm">
              {expanded ? <IconCircleMinus size={20} /> : <IconCirclePlus size={20} />}
            </ActionIcon>
          )}
        </Group>
      </Box>

      {/* Render children when expanded */}
      {expanded && expandable && (
        <Box
          ml={spacing.md}
          style={{
            borderLeft: `2px solid ${styleConfig.borderColor}`,
          }}
        >
          {childNodes}
        </Box>
      )}
    </Box>
  );
}
