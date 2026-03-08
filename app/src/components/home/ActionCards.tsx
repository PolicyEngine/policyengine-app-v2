import { Container, Text } from '@/components/ui';
import { CALCULATOR_URL } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function ActionCards() {
  const countryId = useCurrentCountry();

  return (
    <Container size="xl" style={{ paddingBottom: spacing['4xl'] }}>
      <div className="tw:flex tw:items-center tw:justify-center">
        <a
          href={`${CALCULATOR_URL}/${countryId}/reports`}
          className="tw:no-underline"
          style={{
            display: 'block',
            padding: spacing.xl,
            borderRadius: spacing.radius.container,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: `1.5px solid ${colors.primary[500]}`,
            fontFamily: typography.fontFamily.primary,
            boxShadow: `0 1px 3px ${colors.shadow.medium}`,
          }}
        >
          <Text fw={typography.fontWeight.semibold} c={colors.primary[500]} size="xl">
            Enter PolicyEngine
          </Text>
        </a>
      </div>
    </Container>
  );
}
