import React, { useState } from 'react';
import { Box, Card, Group, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface CardProps {
  title: string;
  description: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  background?: 'white' | 'green' | 'gray';
}

export function SingleCard({ title, description, onClick, icon, background = 'white' }: CardProps) {
  const [hovered, setHovered] = useState(false);

  const backgroundColor =
    background === 'green'
      ? colors.primary[700]
      : background === 'gray'
        ? colors.gray[100]
        : colors.white;

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

      <Group justify="apart" mb={spacing.sm}>
        <Text
          fw={typography.fontWeight.medium}
          fz={typography.fontSize['2xl']}
          lh={typography.lineHeight.normal}
          c={background === 'green' ? colors.text.inverse : colors.text.primary}
          style={{ fontFamily: typography.fontFamily.primary }}
        >
          {title}
        </Text>
      </Group>

      <Text
        fz={typography.fontSize.lg}
        lh={typography.lineHeight.relaxed}
        c={background === 'green' ? colors.text.inverse : colors.text.secondary}
        style={{ fontFamily: typography.fontFamily.body }}
      >
        {description}
      </Text>
    </Card>
  );
}
