import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Box, Text } from '@mantine/core';
import { colors } from '@/designTokens';
import { FONT_SIZES } from '../../constants';
import { chipStyles } from '../../styles';
import { CreateCustomChipProps } from '../../types';

export function CreateCustomChip({ label, onClick, variant, colorConfig }: CreateCustomChipProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'square') {
    return (
      <Box
        style={{
          ...chipStyles.chipCustomSquare,
          borderColor: isHovered ? colorConfig.accent : colors.border.medium,
          background: isHovered ? colorConfig.bg : colors.gray[50],
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <IconPlus size={20} color={isHovered ? colorConfig.icon : colors.gray[400]} />
        <Text
          ta="center"
          fw={600}
          c={isHovered ? colorConfig.icon : colors.gray[500]}
          style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
        >
          {label}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        ...chipStyles.chipCustomRow,
        borderColor: isHovered ? colorConfig.accent : colors.border.medium,
        background: isHovered ? colorConfig.bg : colors.gray[50],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Box
        style={{
          ...chipStyles.chipRowIcon,
          background: isHovered ? colorConfig.border : colors.gray[100],
        }}
      >
        <IconPlus size={20} color={isHovered ? colorConfig.icon : colors.gray[400]} />
      </Box>
      <Text
        fw={600}
        c={isHovered ? colorConfig.icon : colors.gray[500]}
        style={{ fontSize: FONT_SIZES.normal }}
      >
        {label}
      </Text>
    </Box>
  );
}
