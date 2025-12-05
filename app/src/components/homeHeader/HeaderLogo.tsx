import { Box } from '@mantine/core';
import { WEBSITE_URL } from '@/constants';
import { spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

export default function HeaderLogo() {
  const countryId = useCurrentCountry();

  return (
    <Box
      component="a"
      href={`${WEBSITE_URL}/${countryId}`}
      mr={spacing.md}
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
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
