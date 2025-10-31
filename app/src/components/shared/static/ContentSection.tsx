import { ReactNode } from 'react';
import { Box, Container, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface ContentSectionProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  children: ReactNode;
  centerTitle?: boolean;
  id?: string;
}

export default function ContentSection({
  title,
  variant = 'primary',
  children,
  centerTitle = false,
  id,
}: ContentSectionProps) {
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

  return (
    <Box
      id={id}
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
              textAlign: centerTitle ? 'center' : 'left',
            }}
          >
            {title}
          </Title>
        )}
        <Box
          style={{
            color: textColors[variant],
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}
