import { Box } from '@mantine/core';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

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
