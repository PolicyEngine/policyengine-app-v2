import { Box, Divider, Flex, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <Box
      py={spacing['4xl']}
      px={{ base: spacing.container.md, md: spacing.container.lg }}
      style={{
        backgroundColor: colors.background.secondary,
        borderBottom: `1px solid ${colors.border.dark}`,
      }}
    >
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        gap={{ base: 'md', md: 'xl' }}
      >
        <Box w={{ base: '100%', md: 300 }}>
          <Title
            variant="colored"
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {title}
          </Title>
        </Box>

        <Divider orientation="horizontal" size="xs" color={colors.border.light} hiddenFrom="md" />

        <Divider orientation="vertical" size="xs" color={colors.border.light} visibleFrom="md" />

        <Box w={{ base: '100%', md: 'auto' }}>
          <Text
            style={{
              color: colors.text.primary,
              fontSize: typography.fontSize.lg,
              lineHeight: typography.lineHeight.relaxed,
              fontFamily: typography.fontFamily.body,
              textAlign: { base: 'left', md: 'center' },
            }}
          >
            {description}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
