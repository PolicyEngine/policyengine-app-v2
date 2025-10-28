import { useEffect, useRef, useState } from 'react';
import { Box, Button, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface ActionButtonProps {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'inverted';
  multiline?: boolean;
  caption?: string;
}

export default function ActionButton({
  text,
  href,
  variant = 'primary',
  multiline = false,
  caption,
}: ActionButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number | null>(null);

  useEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [text, multiline]);
  const styles = {
    primary: {
      backgroundColor: colors.white,
      color: colors.text.primary,
      border: `2px solid ${colors.border.light}`,
      hoverBackground: colors.gray[50],
      hoverBorder: colors.black,
    },
    secondary: {
      backgroundColor: colors.primary[500],
      color: colors.white,
      border: `2px solid ${colors.primary[500]}`,
      hoverBackground: colors.primary[600],
      hoverBorder: colors.primary[600],
    },
    inverted: {
      backgroundColor: colors.white,
      color: colors.text.primary,
      border: `2px solid ${colors.white}`,
      hoverBackground: colors.gray[50],
      hoverBorder: colors.black,
    },
  };

  const buttonStyle = styles[variant];

  return (
    <Box
      style={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Button
        ref={buttonRef}
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        size="lg"
        px={spacing.xl}
        py={spacing.lg}
        styles={{
          root: {
            backgroundColor: buttonStyle.backgroundColor,
            color: buttonStyle.color,
            border: buttonStyle.border,
            borderRadius: spacing.md,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.primary,
            transition: 'all 0.2s ease',
            whiteSpace: multiline ? 'pre-line' : 'normal',
            height: 'auto',
            minHeight: '48px',
            '&:hover': {
              backgroundColor: buttonStyle.hoverBackground,
              borderColor: buttonStyle.hoverBorder,
              transform: 'translateY(-2px)',
            },
          },
        }}
      >
        {text}
      </Button>
      {caption && (
        <Box
          mt={spacing.lg}
          style={{
            width: buttonWidth ? `${buttonWidth}px` : 'auto',
          }}
        >
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              color: variant === 'primary' ? colors.text.secondary : colors.text.inverse,
              fontFamily: typography.fontFamily.body,
              textAlign: 'center',
            }}
          >
            {caption}
          </Text>
        </Box>
      )}
    </Box>
  );
}
