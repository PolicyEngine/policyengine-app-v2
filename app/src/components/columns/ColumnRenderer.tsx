import { Text } from '@mantine/core';
import { colors } from '@/designTokens';
import { BulletsColumn } from './BulletsColumn';
import { LinkColumn } from './LinkColumn';
import { MenuColumn } from './MenuColumn';
import { SplitMenuColumn } from './SplitMenuColumn';
import { TextColumn } from './TextColumn';
import {
  BulletsColumnConfig,
  BulletsValue,
  ColumnConfig,
  ColumnValue,
  IngredientRecord,
  LinkColumnConfig,
  LinkValue,
  MenuColumnConfig,
  SplitMenuColumnConfig,
  TextColumnConfig,
  TextValue,
} from './types';

interface ColumnRendererProps {
  config: ColumnConfig;
  record: IngredientRecord;
}

export function ColumnRenderer({ config, record }: ColumnRendererProps) {
  const value = record[config.key] as ColumnValue;

  if (!value && config.type !== 'menu' && config.type !== 'split-menu') {
    return (
      <Text size="sm" c={colors.text.secondary}>
        —
      </Text>
    );
  }

  switch (config.type) {
    case 'text':
      return <TextColumn config={config as TextColumnConfig} value={value as TextValue} />;

    case 'link':
      return <LinkColumn config={config as LinkColumnConfig} value={value as LinkValue} />;

    case 'bullets':
      return <BulletsColumn config={config as BulletsColumnConfig} value={value as BulletsValue} />;

    case 'menu':
      return <MenuColumn config={config as MenuColumnConfig} record={record} />;

    case 'split-menu':
      return <SplitMenuColumn config={config as SplitMenuColumnConfig} record={record} />;

    default:
      return <Text size="sm">{String(value)}</Text>;
  }
}
