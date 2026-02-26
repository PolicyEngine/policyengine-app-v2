import { Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

export interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div
      style={{
        paddingTop: spacing['4xl'],
        paddingBottom: spacing['4xl'],
        backgroundColor: colors.background.secondary,
        borderBottom: `1px solid ${colors.border.dark}`,
        paddingLeft: spacing.container.md,
        paddingRight: spacing.container.md,
      }}
    >
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-stretch tw:md:items-center tw:gap-3 tw:md:gap-5">
        <div className="tw:w-full tw:md:w-[300px]">
          <Title
            order={1}
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {title}
          </Title>
        </div>

        {/* Horizontal divider - visible below md */}
        <hr
          className="tw:md:hidden"
          style={{ borderColor: colors.border.light, borderWidth: '0.5px' }}
        />

        {/* Vertical divider - visible at md and above */}
        <div
          className="tw:hidden tw:md:block tw:self-stretch"
          style={{
            borderLeft: `1px solid ${colors.border.light}`,
          }}
        />

        <div className="tw:w-full tw:md:w-auto">
          <Text
            style={{
              color: colors.text.primary,
              fontSize: typography.fontSize.lg,
              lineHeight: typography.lineHeight.relaxed,
              fontFamily: typography.fontFamily.body,
              textAlign: 'left',
            }}
          >
            {description}
          </Text>
        </div>
      </div>
    </div>
  );
}
