import { useState } from 'react';
import { Box, Text, Stack } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { colors } from '@/designTokens';
import { chipStyles } from '../../styles';
import { FONT_SIZES } from '../../constants';
import { BrowseMoreChipProps } from '../../types';

export function BrowseMoreChip({ label, description, onClick, variant, colorConfig }: BrowseMoreChipProps) {
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
        <IconSearch
          size={20}
          color={isHovered ? colorConfig.icon : colors.gray[400]}
        />
        <Text
          ta="center"
          fw={600}
          c={isHovered ? colorConfig.icon : colors.gray[500]}
          style={{ fontSize: FONT_SIZES.small, lineHeight: 1.2 }}
        >
          {label}
        </Text>
        {description && (
          <Text
            ta="center"
            c={isHovered ? colorConfig.icon : colors.gray[400]}
            style={{ fontSize: FONT_SIZES.tiny, lineHeight: 1.2 }}
          >
            {description}
          </Text>
        )}
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
        <IconSearch size={20} color={isHovered ? colorConfig.icon : colors.gray[400]} />
      </Box>
      <Stack gap={2} style={{ flex: 1 }}>
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
    </Box>
  );
}
