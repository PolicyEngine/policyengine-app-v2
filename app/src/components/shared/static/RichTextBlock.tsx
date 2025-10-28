import { ReactNode } from 'react';
import { Box } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface RichTextBlockProps {
  children: ReactNode;
  variant?: 'default' | 'inverted';
}

export default function RichTextBlock({ children, variant = 'default' }: RichTextBlockProps) {
  const textColor = variant === 'inverted' ? colors.text.inverse : colors.text.primary;
  const linkColor = variant === 'inverted' ? colors.text.inverse : colors.primary[500];

  return (
    <Box
      style={{
        color: textColor,
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.base,
        lineHeight: typography.lineHeight.relaxed,
      }}
      styles={{
        root: {
          'p': {
            marginBottom: spacing.md,
            marginTop: 0,
            '&:last-child': {
              marginBottom: 0,
            },
          },
          'a': {
            color: linkColor,
            textDecoration: 'underline',
            transition: 'opacity 0.2s ease',
            '&:hover': {
              opacity: 0.8,
            },
          },
          'strong': {
            fontWeight: typography.fontWeight.bold,
          },
          'em': {
            fontStyle: 'italic',
          },
          'ul, ol': {
            marginBottom: spacing.md,
            paddingLeft: spacing.xl,
          },
          'li': {
            marginBottom: spacing.xs,
          },
        },
      }}
    >
      {children}
    </Box>
  );
}
