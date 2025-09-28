import { Box, Text } from '@mantine/core';
import PolicyEngineLogo from '@/assets/policyengine-logo.svg';
import { colors, spacing } from '@/designTokens';

interface HeaderBarProps {
  title?: string;
  children?: React.ReactNode;
  showLogo?: boolean;
}

export default function HeaderBar({ title, children, showLogo = false }: HeaderBarProps) {
  return (
    <Box
      bg={colors.primary[900]}
      px={16}
      py={16}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center' }}>
        {showLogo && (
          <img
            src={PolicyEngineLogo}
            alt="PolicyEngine"
            style={{
              height: 24,
              width: 'auto',
              marginRight: title ? 12 : 0,
            }}
          />
        )}
        {title && (
          <Text c="white" fw={700} size="md">
            {title}
          </Text>
        )}
      </Box>
      {children}
    </Box>
  );
}
