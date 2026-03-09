import { useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { chipStyles } from '../../styles';
import { BrowseMoreChipProps } from '../../types';

export function BrowseMoreChip({
  label,
  description,
  onClick,
  variant,
  colorConfig,
}: BrowseMoreChipProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'square') {
    return (
      <div
        role="button"
        tabIndex={0}
        style={{
          ...chipStyles.chipCustomSquare,
          borderColor: isHovered ? colorConfig.accent : colors.border.medium,
          background: isHovered ? colorConfig.bg : colors.gray[50],
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <IconSearch size={20} color={isHovered ? colorConfig.icon : colors.gray[400]} />
        <Text
          fw={600}
          c={isHovered ? colorConfig.icon : colors.gray[500]}
          style={{ textAlign: 'center', fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
        >
          {label}
        </Text>
        {description && (
          <Text
            c={isHovered ? colorConfig.icon : colors.gray[400]}
            style={{ textAlign: 'center', fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}
          >
            {description}
          </Text>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        ...chipStyles.chipCustomRow,
        borderColor: isHovered ? colorConfig.accent : colors.border.medium,
        background: isHovered ? colorConfig.bg : colors.gray[50],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        style={{
          ...chipStyles.chipRowIcon,
          background: isHovered ? colorConfig.border : colors.gray[100],
        }}
      >
        <IconSearch size={20} color={isHovered ? colorConfig.icon : colors.gray[400]} />
      </div>
      <Stack style={{ gap: 2, flex: 1 }}>
        <Text
          fw={600}
          c={isHovered ? colorConfig.icon : colors.gray[500]}
          style={{ fontSize: FONT_SIZES.normal }}
        >
          {label}
        </Text>
        {description && (
          <Text
            c={isHovered ? colorConfig.icon : colors.gray[400]}
            style={{ fontSize: FONT_SIZES.small }}
          >
            {description}
          </Text>
        )}
      </Stack>
    </div>
  );
}
