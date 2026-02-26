import { Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface TwoColumnViewProps {
  title: string;
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  backgroundColor?: 'primary' | 'secondary';
}

function TwoColumnView({ title, leftColumn, rightColumn, backgroundColor }: TwoColumnViewProps) {
  function getBackgroundColor(): string {
    if (backgroundColor === 'primary') {
      return colors.primary[100];
    }
    if (backgroundColor === 'secondary') {
      return colors.secondary[100];
    }
    return colors.white;
  }

  return (
    <div
      style={{
        backgroundColor: getBackgroundColor(),
        padding: spacing.container.lg,
        borderRadius: spacing.radius.container,
        minHeight: '400px',
      }}
    >
      <Title
        order={2}
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.title,
          marginBottom: spacing['3xl'],
          textAlign: 'left',
        }}
      >
        {title}
      </Title>
      <div
        className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:items-center"
        style={{ gap: spacing['3xl'] }}
      >
        <div>{leftColumn}</div>
        <div>{rightColumn}</div>
      </div>
    </div>
  );
}

export default TwoColumnView;
