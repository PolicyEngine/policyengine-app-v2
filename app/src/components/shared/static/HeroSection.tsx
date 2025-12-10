import { Box, Divider, Flex, Text, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface HeroSectionProps {
  title: string;
  description: string | React.ReactNode;
  /**
   * @deprecated 'light' variant is deprecated. Use 'default' instead.
   * @deprecated 'accent' variant is deprecated. Use 'dark' instead.
   */
  variant?: 'light' | 'default' | 'accent' | 'dark';
}

export default function HeroSection({ title, description, variant = 'default' }: HeroSectionProps) {
  const isDark = variant === 'accent' || variant === 'dark';

  const backgrounds = {
    light: '#F7FEFE',
    default: '#F7FEFE',
    accent: 'linear-gradient(135deg, #0d2b2a 0%, #164e4a 50%, #0d2b2a 100%)',
    dark: 'linear-gradient(135deg, #0d2b2a 0%, #164e4a 50%, #0d2b2a 100%)',
  };

  const textColors = {
    light: colors.text.primary,
    default: colors.text.primary,
    accent: '#ffffff',
    dark: '#ffffff',
  };

  return (
    <Box
      py={spacing['4xl']}
      style={{
        background: backgrounds[variant],
        borderBottom: isDark ? '1px solid rgba(79, 209, 197, 0.2)' : `1px solid ${colors.border.dark}`,
        paddingLeft: '6.125%',
        paddingRight: '6.125%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative elements for dark variant */}
      {isDark && (
        <>
          <Box
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(79, 209, 197, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              opacity: 0.03,
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        gap={{ base: 'md', md: 'xl' }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Box w={{ base: '100%', md: 300 }}>
          <Title
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.semibold,
              fontFamily: isDark ? "Georgia, 'Times New Roman', serif" : typography.fontFamily.primary,
              color: textColors[variant],
            }}
          >
            {title}
          </Title>
        </Box>

        <Divider
          orientation="horizontal"
          size="xs"
          color={isDark ? 'rgba(79, 209, 197, 0.3)' : colors.border.dark}
          hiddenFrom="md"
        />

        <Divider
          orientation="vertical"
          size="xs"
          color={isDark ? 'rgba(79, 209, 197, 0.3)' : colors.border.dark}
          visibleFrom="md"
        />

        <Box flex={1}>
          <Text
            style={{
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : textColors[variant],
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
