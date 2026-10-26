import type { ReactNode } from 'react';
import { Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface MissingParametersNoticeProps {
  /** What cannot be run, as the sentence starts: "This reform", "This report". */
  subject: string;
  /** The parameter paths the model no longer has, as the API reports them. */
  parameterPaths: string[];
  /** A sentence after the list, e.g. what still shows. */
  children?: ReactNode;
}

/**
 * Says that something cannot be run because its policy sets parameters the
 * current model no longer has, and names them. They have no labels in the
 * model any more, so each is shown by its path.
 */
export default function MissingParametersNotice({
  subject,
  parameterPaths,
  children,
}: MissingParametersNoticeProps) {
  return (
    <Stack role="alert" style={{ gap: spacing.xs, alignItems: 'flex-start' }}>
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.error }}>
        {subject} cannot be run, because it changes{' '}
        {parameterPaths.length === 1 ? 'a parameter' : 'parameters'} that PolicyEngine’s model no
        longer has:
      </Text>
      <ul style={{ margin: 0, paddingLeft: spacing.lg }}>
        {parameterPaths.map((path) => (
          <li key={path}>
            <code
              style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.xs,
                color: colors.text.primary,
                overflowWrap: 'anywhere',
              }}
            >
              {path}
            </code>
          </li>
        ))}
      </ul>
      {children && (
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          {children}
        </Text>
      )}
    </Stack>
  );
}
