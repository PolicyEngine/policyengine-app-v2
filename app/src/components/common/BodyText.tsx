import { Text } from '@mantine/core';
import { colors, typography } from '@/designTokens';

export const BodyText = ({
  children,
  background,
}: {
  children: React.ReactNode;
  background?: string;
}) => (
  <Text
    fz={typography.fontSize.lg}
    lh={typography.lineHeight.relaxed}
    c={background === 'green' ? colors.text.inverse : colors.text.secondary}
    style={{ fontFamily: typography.fontFamily.body }}
  >
    {children}
  </Text>
);
