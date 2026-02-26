import React, { useState } from 'react';
import { Badge, Box, Card, Flex, Group, Image, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface CardProps {
  title: string;
  description: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  background?: 'white' | 'green' | 'gray';
  tags?: string[];
  footerText?: string;
  image?: string;
}

export function SingleCard({
  title,
  description,
  onClick,
  icon,
  background = 'white',
  tags = [],
  footerText,
  image,
}: CardProps) {
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
      radius={spacing.radius.container}
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

      <Text
        fw={typography.fontWeight.medium}
        fz={typography.fontSize['2xl']}
        lh={typography.lineHeight.normal}
        c={background === 'green' ? colors.text.inverse : colors.text.primary}
        style={{ fontFamily: typography.fontFamily.primary }}
      >
        {title}
      </Text>

      {tags.length > 0 && (
        <Group mb={spacing.lg} align="left" style={{ flexWrap: 'wrap' }} mt={spacing.md}>
          {tags.map((tag, idx) => (
            <Badge
              key={idx}
              radius={spacing.radius.container}
              c={background === 'green' ? colors.text.inverse : colors.text.primary}
              variant="filled"
              style={{
                backgroundColor: background === 'green' ? colors.primary[500] : colors.gray[200],
              }}
            >
              {tag}
            </Badge>
          ))}
        </Group>
      )}

      <Text
        fz={typography.fontSize.lg}
        lh={typography.lineHeight.relaxed}
        c={background === 'green' ? colors.text.inverse : colors.text.secondary}
        style={{ fontFamily: typography.fontFamily.body }}
      >
        {description}
      </Text>

      {(footerText || image) && (
        <Flex
          mt={spacing.lg}
          align="left"
          gap="xl"
          direction="column"
          style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
          {image && (
            <Image
              src={image}
              style={{ width: '90%', height: 'auto', objectFit: 'cover', justifySelf: 'center' }}
              radius={spacing.radius.container}
            />
          )}
          {footerText && (
            <Text
              fz={typography.fontSize.base}
              c={background === 'green' ? colors.text.inverse : colors.text.primary}
              style={{
                textDecoration: 'underline',
              }}
              onClick={onClick}
            >
              {footerText}
            </Text>
          )}
        </Flex>
      )}
    </Card>
  );
}
