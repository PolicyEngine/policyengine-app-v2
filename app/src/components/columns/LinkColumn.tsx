import { AppLink } from '@/components/AppLink';
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
    <AppLink
      to={value.url || `${config.urlPrefix || '#'}${value.text}`}
      className="tw:no-underline tw:hover:underline"
      style={{
        color: config.color || colors.text.link,
        fontSize: fontSizeMap[config.size || 'sm'],
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {value.text}
    </AppLink>
  );
}
