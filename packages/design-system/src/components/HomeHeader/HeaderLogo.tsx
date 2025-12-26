import { Box } from '@mantine/core';
import { spacing } from '../../tokens';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

interface HeaderLogoProps {
  countryId: string;
  websiteUrl: string;
}

export function HeaderLogo({ countryId, websiteUrl }: HeaderLogoProps) {
  return (
    <Box
      component="a"
      href={`${websiteUrl}/${countryId}`}
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
