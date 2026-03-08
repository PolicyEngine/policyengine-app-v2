import { Link } from 'react-router-dom';
import { spacing } from '@/designTokens';
import { useWebsitePath } from '@/hooks/useWebsitePath';

const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

const logoContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
};

const logoImageStyles: React.CSSProperties = {
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
    <a href={href} style={{ ...logoContainerStyles, marginRight: spacing.md }}>
      {logoImage}
    </a>
  );
}
