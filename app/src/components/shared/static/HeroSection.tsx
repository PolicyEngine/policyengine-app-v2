import { Box, Divider, Flex, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface HeroSectionProps {
  title: string;
  description: string | React.ReactNode;
  variant?: 'default' | 'dark';
}

export default function HeroSection({ title, description, variant = 'default' }: HeroSectionProps) {
  const backgrounds = {
    default: '#F7FEFE',
    dark: colors.primary[700],
  };

  const textColors = {
    default: colors.text.primary,
    dark: colors.text.inverse,
  };

  return (
    <Box
      py={spacing['4xl']}
      style={{
        backgroundColor: backgrounds[variant],
        borderBottom: `1px solid ${colors.border.dark}`,
        paddingLeft: '6.125%',
        paddingRight: '6.125%',
      }}
    >
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        gap={{ base: 'md', md: 'xl' }}
      >
        <Box w={{ base: '100%', md: 300 }}>
          <Title
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
              color: textColors[variant],
            }}
          >
            {title}
          </Title>
        </Box>

        <Divider
          orientation="horizontal"
          size="xs"
          color={
            variant === 'dark' ? colors.text.inverse : colors.border.dark
          }
          hiddenFrom="md"
        />

        <Divider
          orientation="vertical"
          size="xs"
          color={
            variant === 'dark' ? colors.text.inverse : colors.border.dark
          }
          visibleFrom="md"
        />

        <Box flex={1}>
          <Text
            style={{
              color: textColors[variant],
              fontSize: typography.fontSize.lg,
              lineHeight: typography.lineHeight.relaxed,
              fontFamily: typography.fontFamily.body,
            }}
            ta={{ base: 'left', md: 'left' }}
          >
            {description}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
