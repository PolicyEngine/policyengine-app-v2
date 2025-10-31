import { Box } from '@mantine/core';
import PolicyEngineLogo from '@/assets/policyengine-logo.svg';
import { spacing } from '@/designTokens';

export default function HeaderLogo() {
  return (
    <Box mr={spacing.md} style={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={PolicyEngineLogo}
        alt="PolicyEngine"
        style={{
          height: spacing['3xl'],
          width: 'auto',
          marginRight: 12,
        }}
      />
    </Box>
  );
}
