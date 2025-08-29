import { Text } from '@mantine/core';
import { colors, typography } from '@/designTokens';

export const TitleText = ({
  children,
  background,
}: {
  children: React.ReactNode;
  background?: string;
}) => (
  <Text
    fw={typography.fontWeight.medium}
    fz={typography.fontSize['2xl']}
    lh={typography.lineHeight.normal}
    c={background === 'green' ? colors.text.inverse : colors.text.primary}
    style={{ fontFamily: typography.fontFamily.primary }}
  >
    {children}
  </Text>
);
