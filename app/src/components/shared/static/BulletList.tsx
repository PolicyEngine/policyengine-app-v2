import { Text } from '@/components/ui';
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
    <ul className="tw:flex tw:flex-col tw:gap-4 tw:list-disc tw:pl-6">
      {items.map((item, index) => (
        <li key={index} className="tw:w-full">
          <div style={{ marginTop: spacing.xs }}>
            <Text
              weight="bold"
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
          </div>
        </li>
      ))}
    </ul>
  );
}
