import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { Text } from '@/components/ui';
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
    <div className="tw:flex tw:flex-col tw:items-center tw:text-center">
      <a
        ref={buttonRef}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="tw:no-underline tw:inline-flex tw:items-center tw:justify-center tw:transition-all tw:duration-200 hover:tw:-translate-y-0.5"
        style={{
          backgroundColor: buttonStyle.backgroundColor,
          color: buttonStyle.color,
          border: buttonStyle.border,
          borderRadius: spacing.radius.container,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
          whiteSpace: multiline ? 'pre-line' : 'normal',
          height: 'auto',
          minHeight: '48px',
          padding: `${spacing.lg} ${spacing.xl}`,
        }}
      >
        {text}
      </a>
      {caption && (
        <div
          style={{
            marginTop: spacing.lg,
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
        </div>
      )}
    </div>
  );
}
