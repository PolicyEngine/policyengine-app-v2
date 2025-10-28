import { ReactNode } from 'react';
import { Text } from '@mantine/core';
import { colors } from '@/designTokens';

export interface RichTextBlockProps {
  children: ReactNode;
  variant?: 'default' | 'inverted';
}

export default function RichTextBlock({ children, variant = 'default' }: RichTextBlockProps) {
  const textColor = variant === 'inverted' ? colors.text.inverse : colors.text.primary;
  const linkColor = variant === 'inverted' ? colors.text.inverse : colors.primary[500];

  return (
    <Text
      variant="richText"
      style={{
        color: textColor,
        // CSS custom property for link color that the variant can use
        ['--link-color' as any]: linkColor,
      }}
      styles={{
        root: {
          '& a': {
            color: 'var(--link-color)',
          },
        },
      }}
    >
      {children}
    </Text>
  );
}
