import { useState } from 'react';
import { IconCircleMinus, IconCirclePlus, IconTriangleFilled } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { ActionIcon, Box, Group, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { RootState } from '@/store';
import { Household } from '@/types/ingredients/Household';
import {
  formatVariableValue,
  getParameterAtInstant,
  getValueFromHousehold,
  shouldShowVariable,
} from '@/utils/householdValues';
import { CURRENT_YEAR } from '@/constants';

interface HouseholdOverviewProps {
  output: Household;
}

/**
 * Overview sub-page for household report outputs
 * Based on the v1 NetIncomeBreakdown.jsx component with recursive expansion logic
 *
 * Structure:
 * - Title showing total net income at top
 * - Recursive breakdown of income components
 * - Each component can expand to show its children
 * - Up arrows (blue) for additions, down arrows (gray) for subtractions
 */
export default function HouseholdOverview({ output }: HouseholdOverviewProps) {
  const metadata = useSelector((state: RootState) => state.metadata);

  console.log(metadata);

  // Get the root variable (household_net_income)
  const rootVariable = metadata.variables.household_net_income;
  if (!rootVariable) {
    return (
      <Box>
        <Text c="red">Error: household_net_income variable not found in metadata</Text>
      </Box>
    );
  }

  // Calculate the net income value
  const netIncome = getValueFromHousehold('household_net_income', null, null, output, metadata);
  const netIncomeValue = typeof netIncome === 'number' ? netIncome : 0;

  /**
   * Recursive component that renders a variable and its children
   * Based on the v1 app's VariableArithmetic component
   */
  interface VariableArithmeticProps {
    variableName: string;
    household: Household;
    isAdd: boolean;
    defaultExpanded?: boolean;
    childrenOnly?: boolean;
  }

  const VariableArithmetic = ({
    variableName,
    household,
    isAdd,
    defaultExpanded = false,
    childrenOnly = false,
  }: VariableArithmeticProps) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const variable = metadata.variables[variableName];
    if (!variable) {
      return null;
    }

    // Get the value for this variable
    const value = getValueFromHousehold(variableName, null, null, household, metadata);
    const numericValue = typeof value === 'number' ? value : 0;

    // Get child variables (adds and subtracts)
    let addsArray: string[] = [];
    let subtractsArray: string[] = [];

    if (variable.adds) {
      if (typeof variable.adds === 'string') {
        // It's a parameter name - resolve it
        const parameter = metadata.parameters[variable.adds];
        if (parameter) {
          addsArray = getParameterAtInstant(parameter, `${CURRENT_YEAR}-01-01`) || [];
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
          subtractsArray = getParameterAtInstant(parameter, '2025-01-01') || [];
        }
      } else if (Array.isArray(variable.subtracts)) {
        subtractsArray = variable.subtracts;
      }
    }

    // Filter child variables to only show non-zero ones
    const visibleAdds = addsArray.filter((v) =>
      shouldShowVariable(v, household, null, metadata, false)
    );
    const visibleSubtracts = subtractsArray.filter((v) =>
      shouldShowVariable(v, household, null, metadata, false)
    );

    // Recursively render children
    const childAddNodes = visibleAdds.map((childVar) => (
      <VariableArithmetic
        key={childVar}
        variableName={childVar}
        household={household}
        isAdd={isAdd} // Children of additions keep the same sign
        defaultExpanded={false}
      />
    ));

    const childSubtractNodes = visibleSubtracts.map((childVar) => (
      <VariableArithmetic
        key={childVar}
        variableName={childVar}
        household={household}
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

    // Determine colors and icons based on isAdd
    const Arrow = isAdd ? (
      <IconTriangleFilled size={14} style={{ color: colors.primary[700] }} />
    ) : (
      <IconTriangleFilled
        size={14}
        style={{ color: colors.text.secondary, transform: 'rotate(180deg)' }}
      />
    );

    const valueColor = isAdd ? colors.primary[700] : colors.text.secondary;
    const borderColor = isAdd ? colors.primary[700] : colors.text.secondary;

    return (
      <Box>
        <Box
          p={spacing.md}
          onClick={() => expandable && setExpanded(!expanded)}
          style={{
            borderLeft: `3px solid ${borderColor}`,
            paddingLeft: spacing.lg,
            cursor: expandable ? 'pointer' : 'default',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (expandable) {
              e.currentTarget.style.backgroundColor = colors.gray[50];
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap={spacing.sm}>
              <Text size="md" fw={typography.fontWeight.normal} c={colors.text.secondary}>
                Your {variable.label} {variable.label.endsWith('s') ? 'are' : 'is'}
              </Text>
              {Arrow}
              <Text size="md" fw={typography.fontWeight.semibold} c={valueColor}>
                {formatVariableValue(variable, numericValue, 0)}
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
              borderLeft: `2px solid ${borderColor}`,
            }}
          >
            {childNodes}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Stack gap={spacing.xl}>
      {/* Summary Card */}
      <Box
        p={spacing.xl}
        style={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.sm,
          backgroundColor: colors.background.primary,
        }}
      >
        <Stack gap={spacing.lg}>
          {/* Main Title */}
          <Box>
            <Text size="xl" fw={typography.fontWeight.semibold} c={colors.primary[700]}>
              Your net income is {formatVariableValue(rootVariable, netIncomeValue, 0)}
            </Text>
          </Box>

          {/* Recursive Breakdown List */}
          <Box
            style={{
              borderLeft: `3px solid ${colors.primary[700]}`,
            }}
          >
            <VariableArithmetic
              variableName="household_net_income"
              household={output}
              isAdd
              defaultExpanded={false}
              childrenOnly // Only show children, not the root variable itself
            />
          </Box>

          {/* Description */}
          <Box ta="center" mt={spacing.sm}>
            <Text size="sm" c={colors.text.secondary}>
              Here&apos;s how we calculated your household&apos;s net income. Click to expand a
              section and see the breakdown.
            </Text>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
