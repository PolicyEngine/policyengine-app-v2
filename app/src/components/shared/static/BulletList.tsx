import { Box, List, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface BulletItem {
  title: string;
  description: string;
}

export interface BulletListProps {
  items: BulletItem[];
  variant?: 'default' | 'inverted';
}

export default function BulletList({ items, variant = 'default' }: BulletListProps) {
  const textColor = variant === 'inverted' ? colors.text.inverse : colors.text.primary;

  return (
    <List
      spacing="lg"
      styles={{
        itemWrapper: {
          width: '100%',
        },
        itemLabel: {
          marginTop: spacing.xs,
        },
      }}
    >
      {items.map((item, index) => (
        <List.Item key={index}>
          <Box>
            <Text
              fw="bold"
              style={{
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                color: textColor,
                marginBottom: spacing.xs,
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                color: textColor,
              }}
            >
              {item.description}
            </Text>
          </Box>
        </List.Item>
      ))}
    </List>
  );
}
