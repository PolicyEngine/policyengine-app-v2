import { useState } from 'react';
import { Box, Text, Stack } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { colors } from '@/designTokens';
import { chipStyles } from '../../styles';
import { FONT_SIZES } from '../../constants';
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
    <Box
      style={{
        ...chipStyles.chipRow,
        borderColor: isSelected ? colorConfig.accent : colors.border.light,
        background: isSelected ? colorConfig.bg : (isHovered ? colors.gray[50] : colors.white),
        ...(isSelected ? chipStyles.chipRowSelected : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Box
        style={{
          ...chipStyles.chipRowIcon,
          background: isSelected ? colorConfig.border : colors.gray[100],
        }}
      >
        {icon}
      </Box>
      <Stack gap={2} style={{ flex: 1 }}>
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
      {isSelected && (
        <IconCheck size={18} color={colorConfig.accent} stroke={2.5} />
      )}
    </Box>
  );
}
