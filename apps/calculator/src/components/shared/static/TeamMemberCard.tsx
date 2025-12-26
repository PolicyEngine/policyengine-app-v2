import { Box, Grid, Image, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface TeamMember {
  name: string;
  bio: string;
  image: string;
}

export interface TeamMemberCardProps {
  member: TeamMember;
  variant?: 'default' | 'inverted';
}

export default function TeamMemberCard({ member, variant = 'default' }: TeamMemberCardProps) {
  const borderColor = variant === 'inverted' ? colors.white : colors.black;
  const textColor = variant === 'inverted' ? colors.text.inverse : colors.text.primary;
  const nameColor = variant === 'inverted' ? colors.white : colors.text.primary;

  return (
    <Grid
      style={{
        marginTop: 50,
      }}
      gutter="5vw"
      align="stretch"
    >
      <Grid.Col span="content">
        <Image
          src={member.image}
          alt={member.name}
          h={250}
          w={250}
          radius={spacing.md}
          style={{
            objectFit: 'cover',
          }}
        />
      </Grid.Col>

      <Grid.Col span="auto">
        <Box
          style={{
            borderBottom: `1px solid ${borderColor}`,
            paddingBottom: 50,
            height: '100%',
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              lineHeight: typography.lineHeight.relaxed,
              color: textColor,
            }}
          >
            <Text
              component="span"
              fw={typography.fontWeight.semibold}
              style={{
                fontFamily: typography.fontFamily.primary,
                letterSpacing: '0.05em',
                color: nameColor,
                textTransform: 'uppercase',
              }}
            >
              {member.name}
            </Text>{' '}
            {member.bio}
          </Text>
        </Box>
      </Grid.Col>
    </Grid>
  );
}
