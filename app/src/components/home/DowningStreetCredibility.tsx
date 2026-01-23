import { IconBuildingCastle } from '@tabler/icons-react';
import { Anchor, Box, Container, Group, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

const GOV_UK_ARTICLE_URL = 'https://fellows.ai.gov.uk/articles/nikhil-woodruff-micro-simulation';

/**
 * Social proof element highlighting PolicyEngine's use at 10 Downing Street.
 * Shown on the UK homepage after the hero section.
 */
export default function DowningStreetCredibility() {
  return (
    <Container size="xl" py={spacing.xl}>
      <Box
        style={{
          backgroundColor: colors.primary[50],
          borderRadius: spacing.radius.lg,
          padding: `${spacing.lg} ${spacing.xl}`,
          border: `1px solid ${colors.primary[100]}`,
        }}
      >
        <Group justify="center" align="center" gap={spacing.md} wrap="wrap">
          <IconBuildingCastle
            size={24}
            color={colors.primary[600]}
            stroke={1.5}
            aria-hidden="true"
          />
          <Text
            size={typography.fontSize.base}
            c={colors.gray[700]}
            ta="center"
            style={{ fontFamily: typography.fontFamily.primary }}
          >
            Our technology supports policy analysis at 10 Downing Street.{' '}
            <Anchor
              href={GOV_UK_ARTICLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              style={{
                color: colors.primary[600],
                fontWeight: typography.fontWeight.medium,
              }}
            >
              Learn more
            </Anchor>
          </Text>
        </Group>
      </Box>
    </Container>
  );
}
