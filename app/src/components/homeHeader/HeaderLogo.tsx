/**
 * HeaderLogo - Editorial Brand Mark
 *
 * Clean, sophisticated logo presentation with subtle hover animation.
 */

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
      mr={spacing.lg}
      style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 200ms ease, opacity 200ms ease',
      }}
      onClick={handleLogoClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.opacity = '0.9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.opacity = '1';
      }}
    >
      <img
        src={PolicyEngineLogo}
        alt="PolicyEngine"
        style={{
          height: '26px',
          width: 'auto',
        }}
      />
    </Box>
  );
}
