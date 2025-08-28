import React, { useState } from 'react';
import { Box, Card } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { BodyText } from '../../common/BodyText';
import { TitleText } from '../../common/TitleText';

export interface CardProps {
  title: string;
  description: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  background?: 'white' | 'green' | 'gray';
}

export function SingleCard({ title, description, onClick, icon, background = 'white' }: CardProps) {
  const [hovered, setHovered] = useState(false);

  let backgroundColor: string;
  switch (background) {
    case 'green':
      backgroundColor = colors.primary[700];
      break;
    case 'gray':
      backgroundColor = colors.gray[100];
      break;
    case 'white':
    default:
      backgroundColor = colors.white;
      break;
  }

  return (
    <Card
      shadow="sm"
      padding={spacing['3xl']}
      radius={spacing.radius.lg}
      withBorder
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor,
        border: hovered ? `solid ${colors.black}` : `solid ${colors.border.light}`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.2s ease-in-out',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon && <Box mb={spacing.sm}>{icon}</Box>}

      <TitleText background={background}>{title}</TitleText>

      <BodyText background={background}>{description}</BodyText>
    </Card>
  );
}
