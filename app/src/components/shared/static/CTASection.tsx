import { ReactNode } from 'react';
import { Container, Title } from '@/components/ui';
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
    <div
      style={{
        paddingTop: spacing['4xl'],
        paddingBottom: spacing['4xl'],
        backgroundColor: backgrounds[variant],
        borderBottom: `1px solid ${colors.border.dark}`,
        paddingLeft: '6.125%',
        paddingRight: '6.125%',
      }}
    >
      <Container size="xl" className="tw:px-0">
        {title && (
          <Title
            order={2}
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
              color: textColors[variant],
              marginBottom: spacing.xl,
            }}
          >
            {title}
          </Title>
        )}
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-stretch tw:md:items-center tw:gap-6 tw:md:gap-12">
          <div style={{ flex: 1.5, color: textColors[variant] }}>{content}</div>
          <div className="tw:flex tw:flex-1 tw:flex-col tw:items-center tw:justify-center">
            <ActionButton
              {...cta}
              variant={isInverted ? 'inverted' : 'primary'}
              caption={caption}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
