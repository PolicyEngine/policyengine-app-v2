import { Text } from '@/components/ui';
import { colors, typography } from '@/designTokens';
import { TextColumnConfig, TextValue } from './types';

interface TextColumnProps {
  config: TextColumnConfig;
  value: TextValue;
}

export function TextColumn({ config, value }: TextColumnProps) {
  return (
    <Text
      size={config.size || 'sm'}
      fw={typography.fontWeight[config.weight || 'normal']}
      c={config.color || colors.text.primary}
    >
      {value.text}
    </Text>
  );
}
