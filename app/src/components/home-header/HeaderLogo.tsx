import { useNavigate } from 'react-router-dom';
import { Box } from '@mantine/core';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

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
          height: '24px',
          width: 'auto',
          marginRight: 12,
        }}
      />
    </Box>
  );
}
