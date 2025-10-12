import { Link } from 'react-router-dom';
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
      component={Link}
      to={value.url || `${config.urlPrefix || '#'}${value.text}`}
      size={config.size || 'sm'}
      c={config.color || colors.blue[600]}
      td="none"
      onClick={(e) => e.stopPropagation()}
    >
      {value.text}
    </Anchor>
  );
}
