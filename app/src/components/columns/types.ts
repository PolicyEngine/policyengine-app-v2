// Column configuration interfaces
export interface BaseColumnConfig {
  key: string;
  header: string;
  type: string; // TODO: Define these as an enum
}

export interface TextColumnConfig extends BaseColumnConfig {
  type: 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
}

export interface LinkColumnConfig extends BaseColumnConfig {
  type: 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  urlPrefix?: string;
}

export interface BulletsColumnConfig extends BaseColumnConfig {
  type: 'bullets';
  items: Array<{
    textKey: string;
    badgeKey?: string;
    badgeColor?: string;
  }>;
}

export interface MenuColumnConfig extends BaseColumnConfig {
  type: 'menu';
  actions: Array<{
    label: string;
    action: string;
    color?: string;
  }>;
  onAction: (action: string, recordId: string) => void;
}

export interface SplitMenuColumnConfig extends BaseColumnConfig {
  type: 'split-menu';
  actions: Array<{
    label: string;
    action: string;
    color?: string;
  }>;
  onAction: (action: string, recordId: string) => void;
}

export type ColumnConfig =
  | TextColumnConfig
  | LinkColumnConfig
  | BulletsColumnConfig
  | MenuColumnConfig
  | SplitMenuColumnConfig;

// Data value interfaces
export interface TextValue {
  text: string;
  loading?: boolean;
}

export interface LinkValue {
  text: string;
  url?: string;
}

export interface BulletValue {
  text: string;
  badge?: string | number;
}

export interface BulletsValue {
  items: BulletValue[];
}

export type ColumnValue = TextValue | LinkValue | BulletsValue | null;

// Record interface
export interface IngredientRecord {
  id: string;
  [key: string]: ColumnValue | string;
}
