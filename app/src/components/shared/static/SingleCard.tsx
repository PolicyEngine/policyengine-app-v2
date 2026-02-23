import React, { useState } from 'react';
import { Badge, Card, CardContent } from '@/components/ui';
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
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="tw:shadow-sm"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor,
        border: hovered ? `solid ${colors.black}` : `solid ${colors.border.light}`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.2s ease-in-out',
        borderRadius: spacing.radius.container,
        padding: spacing['3xl'],
      }}
    >
      <CardContent className="tw:p-0">
        {icon && <div style={{ marginBottom: spacing.sm }}>{icon}</div>}

        <Text
          fw={typography.fontWeight.medium}
          style={{
            color: background === 'green' ? colors.text.inverse : colors.text.primary,
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
                style={{
                  borderRadius: spacing.radius.container,
                  color: background === 'green' ? colors.text.inverse : colors.text.primary,
                  backgroundColor: background === 'green' ? colors.primary[500] : colors.gray[200],
                }}
              >
                {tag}
              </Badge>
            ))}
          </Group>
        )}

        <Text
          style={{
            color: background === 'green' ? colors.text.inverse : colors.text.secondary,
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
                style={{
                  color: background === 'green' ? colors.text.inverse : colors.text.primary,
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
      </CardContent>
    </Card>
  );
}
