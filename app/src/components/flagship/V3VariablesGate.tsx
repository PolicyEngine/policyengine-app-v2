import { ErrorState } from '@/components/flagship/states';
import { Skeleton } from '@/components/ui';
import { spacing } from '@/designTokens';
import { useV3Variables } from '@/hooks/useV3Variables';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';

interface V3VariablesGateProps {
  children: React.ReactNode;
  /** What is waiting, for screen readers ("Loading the household builder"). */
  label: string;
  /** Placeholder while the variables load; a few skeleton rows by default. */
  placeholder?: React.ReactNode;
}

function DefaultPlaceholder({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
    >
      <Skeleton style={{ height: 16, width: '35%' }} />
      <Skeleton style={{ height: 12, width: '80%' }} />
      <Skeleton style={{ height: 12, width: '65%' }} />
    </div>
  );
}

/**
 * An inline placeholder for text made of variable names (a list a reform
 * changes), while the variables load on the v2 routes.
 */
export function VariableNamesLoading() {
  return (
    <span role="status" aria-busy="true" aria-label="Loading variable names">
      <Skeleton style={{ display: 'inline-block', height: 12, width: 120 }} />
    </span>
  );
}

/**
 * On the v2 routes, content that reads the model's variables (the household
 * builder and breakdown, programme names) waits behind a placeholder until
 * the catalog version's variables, loading in the background, are in, with
 * no time limit; a failure says so and asks again. On the v1 routes the
 * whole metadata holds the variables, so the content shows as before.
 */
function V2VariablesGate({ children, label, placeholder }: V3VariablesGateProps) {
  const variables = useV3Variables();
  if (variables.status === 'error') {
    return <ErrorState title="Could not load the model's variables" onRetry={variables.retry} />;
  }
  if (variables.status !== 'ready') {
    return <>{placeholder ?? <DefaultPlaceholder label={label} />}</>;
  }
  return <>{children}</>;
}

function V1VariablesGate({ children }: V3VariablesGateProps) {
  return <>{children}</>;
}

export default V3_API_ROUTES === 'v2' ? V2VariablesGate : V1VariablesGate;
