import { Link } from 'react-router-dom';
import { colors } from '@/designTokens';
import { LinkColumnConfig, LinkValue } from './types';

const fontSizeMap: Record<string, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
};

interface LinkColumnProps {
  config: LinkColumnConfig;
  value: LinkValue;
}

export function LinkColumn({ config, value }: LinkColumnProps) {
  return (
    <Link
      to={value.url || `${config.urlPrefix || '#'}${value.text}`}
      className="tw:no-underline tw:hover:underline"
      style={{
        color: config.color || colors.blue[600],
        fontSize: fontSizeMap[config.size || 'sm'],
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {value.text}
    </Link>
  );
}
