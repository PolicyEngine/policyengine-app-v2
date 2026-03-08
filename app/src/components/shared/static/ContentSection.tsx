import { ReactNode } from 'react';
import { Container, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

export interface ContentSectionProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  children: ReactNode;
  centerTitle?: boolean;
}

export default function ContentSection({
  title,
  variant = 'primary',
  children,
  centerTitle = false,
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
              textAlign: centerTitle ? 'center' : 'left',
              marginBottom: spacing.xl,
            }}
          >
            {title}
          </Title>
        )}
        <div
          style={{
            color: textColors[variant],
          }}
        >
          {children}
        </div>
      </Container>
    </div>
  );
}
