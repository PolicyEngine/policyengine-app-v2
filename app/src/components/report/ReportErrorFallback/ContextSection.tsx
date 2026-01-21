import { Text } from '@mantine/core';
import { spacing, typography } from '@/designTokens';
import { CodeBlock } from './CodeBlock';
import type { ScrubbedReportErrorContext } from './types';

interface ContextSectionProps {
  context: ScrubbedReportErrorContext;
}

/**
 * Displays the report context data including user associations and base ingredients
 */
export function ContextSection({ context }: ContextSectionProps) {
  return (
    <>
      <Text size="sm" fw={typography.fontWeight.semibold} mt={spacing.sm}>
        Report context (user IDs scrubbed)
      </Text>

      {/* User associations */}
      {context.userReport && (
        <CodeBlock title="User report association" content={JSON.stringify(context.userReport, null, 2)} />
      )}

      {context.userSimulations && context.userSimulations.length > 0 && (
        <CodeBlock
          title={`User simulation associations (${context.userSimulations.length})`}
          content={JSON.stringify(context.userSimulations, null, 2)}
        />
      )}

      {context.userPolicies && context.userPolicies.length > 0 && (
        <CodeBlock
          title={`User policy associations (${context.userPolicies.length})`}
          content={JSON.stringify(context.userPolicies, null, 2)}
        />
      )}

      {context.userHouseholds && context.userHouseholds.length > 0 && (
        <CodeBlock
          title={`User household associations (${context.userHouseholds.length})`}
          content={JSON.stringify(context.userHouseholds, null, 2)}
        />
      )}

      {context.userGeographies && context.userGeographies.length > 0 && (
        <CodeBlock
          title={`User geography associations (${context.userGeographies.length})`}
          content={JSON.stringify(context.userGeographies, null, 2)}
        />
      )}

      {/* Base ingredients */}
      <Text size="sm" fw={typography.fontWeight.semibold} mt={spacing.sm}>
        Base ingredients (if fetched)
      </Text>

      {context.report && (
        <CodeBlock title="Report" content={JSON.stringify(context.report, null, 2)} />
      )}

      {context.simulations && context.simulations.length > 0 && (
        <CodeBlock
          title={`Simulations (${context.simulations.length})`}
          content={JSON.stringify(context.simulations, null, 2)}
        />
      )}

      {context.policies && context.policies.length > 0 && (
        <CodeBlock
          title={`Policies (${context.policies.length})`}
          content={JSON.stringify(context.policies, null, 2)}
        />
      )}

      {context.households && context.households.length > 0 && (
        <CodeBlock
          title={`Households (${context.households.length})`}
          content={JSON.stringify(context.households, null, 2)}
        />
      )}

      {context.geographies && context.geographies.length > 0 && (
        <CodeBlock
          title={`Geographies (${context.geographies.length})`}
          content={JSON.stringify(context.geographies, null, 2)}
        />
      )}
    </>
  );
}
