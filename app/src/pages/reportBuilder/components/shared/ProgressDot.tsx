import { Box } from '@mantine/core';
import { colors } from '@/designTokens';

interface ProgressDotProps {
  filled: boolean;
  pulsing?: boolean;
}

export function ProgressDot({ filled, pulsing }: ProgressDotProps) {
  return (
    <Box
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: filled ? colors.primary[500] : colors.gray[200],
        transition: 'all 0.3s ease',
        animation: pulsing ? 'pulse 1.5s ease-in-out infinite' : undefined,
      }}
    />
  );
}
