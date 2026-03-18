import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Text } from '@/components/ui';
import { colors } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { chipStyles } from '../../styles';
import { CreateCustomChipProps } from '../../types';

export function CreateCustomChip({ label, onClick, variant, colorConfig }: CreateCustomChipProps) {
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
        <IconPlus size={20} color={isHovered ? colorConfig.icon : colors.gray[400]} />
        <Text
          fw={600}
          c={isHovered ? colorConfig.icon : colors.gray[500]}
          style={{ textAlign: 'center', fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
        >
          {label}
        </Text>
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
        <IconPlus size={20} color={isHovered ? colorConfig.icon : colors.gray[400]} />
      </div>
      <Text
        fw={600}
        c={isHovered ? colorConfig.icon : colors.gray[500]}
        style={{ fontSize: FONT_SIZES.normal }}
      >
        {label}
      </Text>
    </div>
  );
}
