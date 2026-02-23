import React, { useState } from 'react';
import { Badge, Card } from '@mantine/core';
import { Group, Text } from '@/components/ui';
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
      {icon && <div style={{ marginBottom: spacing.sm }}>{icon}</div>}

      <Text
        fw={typography.fontWeight.medium}
        c={background === 'green' ? colors.text.inverse : colors.text.primary}
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize['2xl'],
          lineHeight: typography.lineHeight.normal,
        }}
      >
        {title}
      </Text>

      {tags.length > 0 && (
        <Group
          wrap="wrap"
          align="start"
          style={{ marginBottom: spacing.lg, marginTop: spacing.md }}
        >
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
        c={background === 'green' ? colors.text.inverse : colors.text.secondary}
        style={{
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.lg,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        {description}
      </Text>

      {(footerText || image) && (
        <div
          className="tw:flex tw:flex-col tw:gap-5"
          style={{
            marginTop: spacing.lg,
            cursor: onClick ? 'pointer' : 'default',
            alignItems: 'flex-start',
          }}
        >
          {image && (
            <img
              src={image}
              alt=""
              style={{
                width: '90%',
                height: 'auto',
                objectFit: 'cover',
                justifySelf: 'center',
                borderRadius: spacing.radius.container,
              }}
            />
          )}
          {footerText && (
            <Text
              c={background === 'green' ? colors.text.inverse : colors.text.primary}
              style={{
                textDecoration: 'underline',
                fontSize: typography.fontSize.base,
              }}
              onClick={onClick}
            >
              {footerText}
            </Text>
          )}
        </div>
      )}
    </Card>
  );
}
