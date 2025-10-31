import { Box, Container, Title } from '@mantine/core';
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
    <Box
      py={spacing['4xl']}
      style={{
        backgroundColor: backgrounds[variant],
        borderBottom: `1px solid ${colors.border.dark}`,
        paddingLeft: '6.125%',
        paddingRight: '6.125%',
      }}
    >
      <Container size="xl" px={0}>
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

        <Box>
          {members.map((member, index) => (
            <TeamMemberCard key={index} member={member} variant={cardVariant} />
          ))}
        </Box>
      </Container>
    </Box>
  );
}
