import { ErrorState } from '@/components/flagship/states';
import { Skeleton } from '@/components/ui';
import { spacing } from '@/designTokens';
import { useV3Variables } from '@/hooks/useV3Variables';

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

/** Where variable names should be, when loading them failed on the v2 routes. */
export function VariableNamesFailed({ onRetry }: { onRetry: () => unknown }) {
  return <ErrorState compact title="Could not load the variable names" onRetry={onRetry} />;
}

/**
 * Content that reads the model's variables (the household builder and
 * breakdown, programme names), shown once `useV3Variables` says they are
 * 'ready'. On the v2 routes it waits behind a placeholder while they load in
 * the background, with no time limit, and a failure says so and asks again;
 * on the v1 routes they are always ready, so the content shows as before.
 */
export default function V3VariablesGate({ children, label, placeholder }: V3VariablesGateProps) {
  const variables = useV3Variables();
  if (variables.state === 'failed') {
    return <ErrorState title="Could not load the model's variables" onRetry={variables.retry} />;
  }
  if (variables.state === 'waiting') {
    return <>{placeholder ?? <DefaultPlaceholder label={label} />}</>;
  }
  return <>{children}</>;
}
