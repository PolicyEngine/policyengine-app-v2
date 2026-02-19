import { useState } from 'react';
import { Box, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { chipStyles } from '../../styles';
import { OptionChipSquareProps } from '../../types';

export function OptionChipSquare({
  icon,
  label,
  description,
  isSelected,
  onClick,
  colorConfig,
}: OptionChipSquareProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      style={{
        ...chipStyles.chipSquare,
        borderColor: isSelected ? colorConfig.accent : colors.border.light,
        background: isSelected ? colorConfig.bg : isHovered ? colors.gray[50] : colors.white,
        ...(isSelected
          ? {
              ...chipStyles.chipSquareSelected,
              boxShadow: `0 0 0 2px ${colorConfig.bg}`,
            }
          : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Box
        style={{
          width: 28,
          height: 28,
          borderRadius: spacing.radius.sm,
          background: isSelected ? colorConfig.border : colors.gray[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Text
        ta="center"
        fw={600}
        c={isSelected ? colorConfig.icon : colors.gray[700]}
        style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
      >
        {label}
      </Text>
      {description && (
        <Text ta="center" c="dimmed" style={{ fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}>
          {description}
        </Text>
      )}
    </Box>
  );
}
