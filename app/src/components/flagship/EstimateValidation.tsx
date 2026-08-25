import { useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { Button, Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type {
  EstimateValidationRequest,
  EstimateValidationResult,
} from '@/libs/flagship/estimateValidator';

const COMPARABILITY_LABELS: Record<string, string> = {
  direct: 'Direct comparison',
  similar: 'Similar proposal',
  context: 'Context only',
};

function compactMoney(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) {
    return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  }
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

type Phase = 'idle' | 'loading' | 'done' | 'error';

/**
 * On-demand external validation for a user-drafted reform: a button that
 * dispatches the fiscal-finder agent (web search over official scores and
 * third-party analyses) and renders its findings with honest comparability
 * labels. Optional by design — nothing runs until asked.
 */
export default function EstimateValidation({ request }: { request: EstimateValidationRequest }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<EstimateValidationResult | null>(null);
  const [error, setError] = useState<string>('');

  const run = async () => {
    setPhase('loading');
    setError('');
    try {
      const response = await fetch('/api/validate-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || `Validation failed (${response.status})`);
      }
      setResult(payload);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Validation failed');
      setPhase('error');
    }
  };

  if (phase === 'loading') {
    return (
      <Stack style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Spinner size="sm" />
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          Searching official scores and external analyses — this takes about a minute.
        </Text>
      </Stack>
    );
  }

  if (phase === 'done' && result) {
    return (
      <Stack style={{ gap: spacing.md, alignItems: 'flex-start' }}>
        {result.findings.length === 0 ? (
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
            No comparable external estimates were found for this reform.
          </Text>
        ) : (
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {result.findings.map((finding) => (
                <tr key={`${finding.source}-${finding.proposal}`}>
                  <td
                    style={{
                      padding: `${spacing.xs} ${spacing.lg} ${spacing.xs} 0`,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.primary,
                      verticalAlign: 'top',
                    }}
                  >
                    {finding.source}
                    {finding.url && (
                      <>
                        {' '}
                        <a
                          href={finding.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: colors.primary[700] }}
                        >
                          source
                        </a>
                      </>
                    )}
                    <div style={{ color: colors.text.secondary, fontSize: typography.fontSize.xs }}>
                      {finding.proposal}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: `${spacing.xs} ${spacing.lg} ${spacing.xs} 0`,
                      fontSize: typography.fontSize.sm,
                      verticalAlign: 'top',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {typeof finding.estimate === 'number' ? compactMoney(finding.estimate) : '—'}
                  </td>
                  <td
                    style={{
                      padding: `${spacing.xs} 0`,
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      verticalAlign: 'top',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {COMPARABILITY_LABELS[finding.comparability]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {result.assessment && (
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: 1.6,
            }}
          >
            {result.assessment}
          </Text>
        )}
        {result.caveats && result.caveats.length > 0 && (
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
            {result.caveats.join(' · ')}
          </Text>
        )}
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          External figures describe the proposals each source scored, which may differ from this
          reform in scope, year, or baseline.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: spacing.sm, alignItems: 'flex-start' }}>
      {phase === 'error' && (
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          {error}
        </Text>
      )}
      <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        Search official scorekeepers (CBO, JCT, state fiscal offices) and third-party analyses for
        estimates of this or similar proposals.
      </Text>
      <Button size="sm" variant="outline" onClick={run}>
        <IconSearch size={14} />
        {phase === 'error' ? 'Retry external check' : 'Find external estimates'}
      </Button>
    </Stack>
  );
}
