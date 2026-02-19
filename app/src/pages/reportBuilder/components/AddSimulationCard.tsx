/**
 * AddSimulationCard - Card to add a new reform simulation
 */

import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Box, Text } from '@mantine/core';
import { colors } from '@/designTokens';
import { FONT_SIZES } from '../constants';
import { styles } from '../styles';
import type { AddSimulationCardProps } from '../types';

export function AddSimulationCard({ onClick, disabled }: AddSimulationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      style={{
        ...styles.addSimulationCard,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderColor: isHovered && !disabled ? colors.primary[400] : colors.border.medium,
        background: isHovered && !disabled ? colors.primary[50] : colors.white,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={disabled ? undefined : onClick}
    >
      <Box
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: isHovered && !disabled ? colors.primary[100] : colors.gray[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <IconPlus
          size={28}
          color={isHovered && !disabled ? colors.primary[600] : colors.gray[400]}
        />
      </Box>
      <Text
        fw={600}
        c={isHovered && !disabled ? colors.primary[700] : colors.gray[500]}
        style={{ fontSize: FONT_SIZES.normal }}
      >
        Add reform simulation
      </Text>
      <Text c="dimmed" ta="center" style={{ fontSize: FONT_SIZES.small, maxWidth: 200 }}>
        Compare policy changes against your baseline
      </Text>
    </Box>
  );
}
