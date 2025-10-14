import { Group, Loader, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { TextColumnConfig, TextValue } from './types';

interface TextColumnProps {
  config: TextColumnConfig;
  value: TextValue;
}

export function TextColumn({ config, value }: TextColumnProps) {
  if (value.loading) {
    return (
      <Group gap={spacing.xs}>
        <Text
          size={config.size || 'sm'}
          fw={typography.fontWeight[config.weight || 'normal']}
          c={config.color || colors.text.primary}
        >
          {value.text}
        </Text>
        <Loader size="xs" />
      </Group>
    );
  }

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
