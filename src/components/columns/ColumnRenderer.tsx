import { Text } from '@mantine/core';
import { colors } from '@/designTokens';
import { ColumnConfig, ColumnValue, IngredientRecord } from './types';
import { TextColumn } from './TextColumn';
import { LinkColumn } from './LinkColumn';
import { BulletsColumn } from './BulletsColumn';
import { MenuColumn } from './MenuColumn';
import { 
  TextColumnConfig, 
  TextValue, 
  LinkColumnConfig, 
  LinkValue, 
  BulletsColumnConfig, 
  BulletsValue, 
  MenuColumnConfig 
} from './types';

interface ColumnRendererProps {
  config: ColumnConfig;
  record: IngredientRecord;
}

export function ColumnRenderer({ config, record }: ColumnRendererProps) {
  const value = record[config.key] as ColumnValue;

  if (!value && config.type !== 'menu') {
    return <Text size="sm" c={colors.text.secondary}>—</Text>;
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
    
    default:
      return <Text size="sm">{String(value)}</Text>;
  }
}