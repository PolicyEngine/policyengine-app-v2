import { Anchor } from '@mantine/core';
import { colors } from '@/designTokens';
import { LinkColumnConfig, LinkValue } from './types';

interface LinkColumnProps {
  config: LinkColumnConfig;
  value: LinkValue;
}

export function LinkColumn({ config, value }: LinkColumnProps) {
  return (
    <Anchor
      size={config.size || 'sm'}
      c={config.color || colors.blue[600]}
      href={value.url || `${config.urlPrefix || '#'}${value.text}`}
      td="none"
      onClick={(e) => e.stopPropagation()}
    >
      {value.text}
    </Anchor>
  );
}
