import { Container, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import TeamMemberCard, { TeamMember } from './TeamMemberCard';

export interface TeamSectionProps {
  title: string;
  members: TeamMember[];
  variant?: 'primary' | 'secondary' | 'accent';
}

export default function TeamSection({ title, members, variant = 'primary' }: TeamSectionProps) {
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

  const cardVariant = variant === 'accent' ? 'inverted' : 'default';

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
        <Title
          order={2}
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.primary,
            color: textColors[variant],
          }}
        >
          {title}
        </Title>

        <div>
          {members.map((member, index) => (
            <TeamMemberCard key={index} member={member} variant={cardVariant} />
          ))}
        </div>
      </Container>
    </div>
  );
}
