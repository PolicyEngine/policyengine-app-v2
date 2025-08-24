import { Box } from '@mantine/core';
import PolicyEngineLogo from '@/assets/policyengine-logo.svg';

export default function SidebarLogo() {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <img
        src={PolicyEngineLogo}
        alt="PolicyEngine"
        style={{
          height: 24,
          width: 'auto',
        }}
      />
    </Box>
  );
}
