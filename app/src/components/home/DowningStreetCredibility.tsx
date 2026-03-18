import { IconBuildingCastle } from '@tabler/icons-react';
import { Container, Group, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

const GOV_UK_ARTICLE_URL = 'https://fellows.ai.gov.uk/articles/nikhil-woodruff-micro-simulation';

/**
 * Social proof element highlighting PolicyEngine's use at 10 Downing Street.
 * Shown on the UK homepage after the hero section.
 */
export default function DowningStreetCredibility() {
  return (
    <Container size="xl" style={{ paddingTop: spacing.xl, paddingBottom: spacing.xl }}>
      <div
        style={{
          backgroundColor: colors.primary[50],
          borderRadius: spacing.radius.container,
          padding: `${spacing.lg} ${spacing.xl}`,
          border: `1px solid ${colors.primary[100]}`,
        }}
      >
        <Group justify="center" align="center" gap="md" wrap="wrap">
          <IconBuildingCastle
            size={24}
            color={colors.primary[600]}
            stroke={1.5}
            aria-hidden="true"
          />
          <Text
            c={colors.gray[700]}
            style={{
              fontSize: typography.fontSize.base,
              textAlign: 'center',
              fontFamily: typography.fontFamily.primary,
            }}
          >
            Our technology supports policy analysis at 10 Downing Street.{' '}
            <a
              href={GOV_UK_ARTICLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: colors.primary[600],
                fontWeight: typography.fontWeight.medium,
                fontSize: typography.fontSize.sm,
              }}
            >
              Learn more
            </a>
          </Text>
        </Group>
      </div>
    </Container>
  );
}
