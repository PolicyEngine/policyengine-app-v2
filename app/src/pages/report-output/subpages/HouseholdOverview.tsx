import { useState } from 'react';
import { IconCircleMinus, IconCirclePlus, IconTriangleFilled } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { ActionIcon, Box, Group, Stack, Text } from '@mantine/core';
import { CURRENT_YEAR } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { RootState } from '@/store';
import { Household } from '@/types/ingredients/Household';
import {
  formatVariableValue,
  getParameterAtInstant,
  getValueFromHousehold,
  shouldShowVariable,
} from '@/utils/householdValues';

interface HouseholdOverviewProps {
  baseline: Household | null;
  reform: Household | null;
}

/**
 * Overview sub-page for household report outputs
 * Based on the v1 NetIncomeBreakdown.jsx component with recursive expansion logic
 *
 * Structure:
 * - Title showing total net income at top (or comparison if reform exists)
 * - Recursive breakdown of income components
 * - Each component can expand to show its children
 * - Up arrows (blue) for additions, down arrows (gray) for subtractions
 * - Shows comparison "rises by" / "falls by" when reform is present
 */
export default function HouseholdOverview({ baseline, reform }: HouseholdOverviewProps) {
  const metadata = useSelector((state: RootState) => state.metadata);

  // Get the root variable (household_net_income)
  const rootVariable = metadata.variables.household_net_income;
  if (!rootVariable) {
    return (
      <Box>
        <Text c="red">Error: household_net_income variable not found in metadata</Text>
      </Box>
    );
  }

  if (!baseline) {
    return (
      <Box>
        <Text c="red">Error: Baseline household data not found</Text>
      </Box>
    );
  }

  const hasReform = reform !== null && reform !== undefined;

  // Calculate baseline net income
  const baselineNetIncome = getValueFromHousehold(
    'household_net_income',
    null,
    null,
    baseline,
    metadata
  );
  const baselineValue = typeof baselineNetIncome === 'number' ? baselineNetIncome : 0;

  // Calculate reform net income and difference if reform exists
  let reformValue = 0;
  let netIncomeDiff = 0;
  if (hasReform) {
    const reformNetIncome = getValueFromHousehold(
      'household_net_income',
      null,
      null,
      reform,
      metadata
    );
    reformValue = typeof reformNetIncome === 'number' ? reformNetIncome : 0;
    netIncomeDiff = reformValue - baselineValue;
  }

  /**
   * Recursive component that renders a variable and its children
   * Based on the v1 app's VariableArithmetic component
   * Now supports comparison between baseline and reform
   */
  interface VariableArithmeticProps {
    variableName: string;
    householdBaseline: Household;
    householdReform: Household | null;
    isAdd: boolean;
    defaultExpanded?: boolean;
    childrenOnly?: boolean;
  }

  const VariableArithmetic = ({
    variableName,
    householdBaseline,
    householdReform,
    isAdd,
    defaultExpanded = false,
    childrenOnly = false,
  }: VariableArithmeticProps) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const variable = metadata.variables[variableName];
    if (!variable) {
      return null;
    }

    // Get baseline value
    const value = getValueFromHousehold(variableName, null, null, householdBaseline, metadata);
    const numericValue = typeof value === 'number' ? value : 0;

    // Check if reform exists and calculate comparison
    const hasReformForVar = householdReform !== null && householdReform !== undefined;
    let valueStr: React.ReactNode;
    let nodeSign = isAdd;

    if (hasReformForVar) {
      // Get reform value and calculate difference
      const reformValue = getValueFromHousehold(
        variableName,
        null,
        null,
        householdReform,
        metadata
      );
      const reformNumeric = typeof reformValue === 'number' ? reformValue : 0;
      const diff = reformNumeric - numericValue;

      // Adjust sign based on whether reform increases or decreases value (XOR logic from v1)
      if (!childrenOnly) {
        nodeSign = nodeSign !== diff < 0;
      }

      // Format the difference text
      if (diff > 0) {
        valueStr = (
          <>
            Your {variable.label} rise{variable.label.endsWith('s') ? '' : 's'} by{' '}
            <Text
              span
              fw={typography.fontWeight.semibold}
              c={nodeSign ? colors.primary[700] : colors.text.secondary}
            >
              {formatVariableValue(variable, diff, 0)}
            </Text>
          </>
        );
      } else if (diff < 0) {
        valueStr = (
          <>
            Your {variable.label} fall{variable.label.endsWith('s') ? '' : 's'} by{' '}
            <Text
              span
              fw={typography.fontWeight.semibold}
              c={nodeSign ? colors.primary[700] : colors.text.secondary}
            >
              {formatVariableValue(variable, Math.abs(diff), 0)}
            </Text>
          </>
        );
      } else {
        valueStr = `Your ${variable.label} ${variable.label.endsWith('s') ? "don't" : "doesn't"} change`;
      }
    } else {
      // No reform - show baseline only
      valueStr = (
        <>
          Your {variable.label} {variable.label.endsWith('s') ? 'are' : 'is'}{' '}
          <Text
            span
            fw={typography.fontWeight.semibold}
            c={nodeSign ? colors.primary[700] : colors.text.secondary}
          >
            {formatVariableValue(variable, numericValue, 0)}
          </Text>
        </>
      );
    }

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

    // Filter child variables to only show non-zero ones (in baseline or reform)
    const visibleAdds = addsArray.filter((v) =>
      shouldShowVariable(v, householdBaseline, householdReform, metadata, false)
    );
    const visibleSubtracts = subtractsArray.filter((v) =>
      shouldShowVariable(v, householdBaseline, householdReform, metadata, false)
    );

    // Recursively render children
    const childAddNodes = visibleAdds.map((childVar) => (
      <VariableArithmetic
        key={childVar}
        variableName={childVar}
        householdBaseline={householdBaseline}
        householdReform={householdReform}
        isAdd={isAdd} // Children of additions keep the same sign
        defaultExpanded={false}
      />
    ));

    const childSubtractNodes = visibleSubtracts.map((childVar) => (
      <VariableArithmetic
        key={childVar}
        variableName={childVar}
        householdBaseline={householdBaseline}
        householdReform={householdReform}
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

    // Determine colors and icons based on nodeSign (adjusted for comparison)
    const Arrow = nodeSign ? (
      <IconTriangleFilled size={14} style={{ color: colors.primary[700] }} />
    ) : (
      <IconTriangleFilled
        size={14}
        style={{ color: colors.text.secondary, transform: 'rotate(180deg)' }}
      />
    );

    const borderColor = nodeSign ? colors.primary[700] : colors.text.secondary;

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
              {Arrow}
              <Text size="md" fw={typography.fontWeight.normal} c={colors.text.secondary}>
                {valueStr}
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
              {hasReform ? (
                netIncomeDiff > 0 ? (
                  <>
                    Your net income increases by{' '}
                    {formatVariableValue(rootVariable, netIncomeDiff, 0)}
                  </>
                ) : netIncomeDiff < 0 ? (
                  <>
                    Your net income decreases by{' '}
                    {formatVariableValue(rootVariable, Math.abs(netIncomeDiff), 0)}
                  </>
                ) : (
                  <>Your net income doesn&apos;t change</>
                )
              ) : (
                <>Your net income is {formatVariableValue(rootVariable, baselineValue, 0)}</>
              )}
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
              householdBaseline={baseline}
              householdReform={reform}
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
