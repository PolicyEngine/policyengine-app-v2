import { Box } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import PolicyEngineLogo from '@/assets/policyengine-logo.svg';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function HeaderLogo() {
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  const handleLogoClick = () => {
    navigate(`/${countryId}`);
  };

  return (
    <Box
      mr={spacing.md}
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
      onClick={handleLogoClick}
    >
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
