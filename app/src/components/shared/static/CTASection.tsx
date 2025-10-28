import { ReactNode } from 'react';
import { Box, Container, Flex, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import ActionButton, { ActionButtonProps } from './ActionButton';

export interface CTASectionProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  content: ReactNode;
  cta: Omit<ActionButtonProps, 'variant'>;
  caption?: string;
}

export default function CTASection({
  title,
  variant = 'accent',
  content,
  cta,
  caption,
}: CTASectionProps) {
  const backgrounds = {
    primary: colors.white,
    secondary: colors.gray[100],
    accent: colors.primary[700],
  };

  const textColors = {
    primary: colors.text.primary,
    secondary: colors.text.primary,
    accent: colors.text.inverse,
  };

  const isInverted = variant === 'accent';

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
      <Container size="xl" px={0}>
        {title && (
          <Title
            order={2}
            mb="xl"
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
              color: textColors[variant],
            }}
          >
            {title}
          </Title>
        )}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          gap={{ base: 'xl', md: '4xl' }}
        >
          <Box flex={{ base: 1, md: 1.5 }} style={{ color: textColors[variant] }}>
            {content}
          </Box>
          <Box
            flex={1}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActionButton
              {...cta}
              variant={isInverted ? 'inverted' : 'primary'}
              caption={caption}
            />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
