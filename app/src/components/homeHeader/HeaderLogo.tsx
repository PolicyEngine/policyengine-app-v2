import { Link } from 'react-router-dom';
import { Box } from '@mantine/core';
import { spacing } from '@/designTokens';
import { useWebsitePath } from '@/hooks/useWebsitePath';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

const logoContainerStyles = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
};

const logoImageStyles = {
  height: '24px',
  width: 'auto',
  marginRight: 12,
};

export default function HeaderLogo() {
  const { getHomeHref } = useWebsitePath();
  const href = getHomeHref();

  const logoImage = <img src={PolicyEngineLogo} alt="PolicyEngine" style={logoImageStyles} />;

  // Relative paths use React Router Link for SPA behavior
  if (href.startsWith('/')) {
    return (
      <Link to={href} style={{ ...logoContainerStyles, marginRight: spacing.md }}>
        {logoImage}
      </Link>
    );
  }

  // Absolute URLs use standard anchor for cross-app navigation
  return (
    <Box component="a" href={href} mr={spacing.md} style={logoContainerStyles}>
      {logoImage}
    </Box>
  );
}
