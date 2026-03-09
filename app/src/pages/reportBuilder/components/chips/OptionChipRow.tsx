import { useState } from 'react';
import { IconCheck } from '@tabler/icons-react';
import { Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { chipStyles } from '../../styles';
import { OptionChipRowProps } from '../../types';

export function OptionChipRow({
  icon,
  label,
  description,
  isSelected,
  onClick,
  colorConfig,
}: OptionChipRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        ...chipStyles.chipRow,
        borderColor: isSelected ? colorConfig.accent : colors.border.light,
        background: isSelected ? colorConfig.bg : isHovered ? colors.gray[50] : colors.white,
        ...(isSelected ? chipStyles.chipRowSelected : {}),
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
          background: isSelected ? colorConfig.border : colors.gray[100],
        }}
      >
        {icon}
      </div>
      <Stack style={{ gap: 2, flex: 1 }}>
        <Text
          fw={600}
          c={isSelected ? colorConfig.icon : colors.gray[700]}
          style={{ fontSize: FONT_SIZES.normal }}
        >
          {label}
        </Text>
        {description && (
          <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
            {description}
          </Text>
        )}
      </Stack>
      {isSelected && <IconCheck size={18} color={colorConfig.accent} stroke={2.5} />}
    </div>
  );
}
