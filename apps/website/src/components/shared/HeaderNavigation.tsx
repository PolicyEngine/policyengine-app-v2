/**
 * Website-specific header navigation wrapper
 * Wraps the design-system HomeHeader with website-specific logic
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeHeader, NavItemSetup } from '@policyengine/design-system';
import { useCurrentCountry, replaceCountryInPath, WEBSITE_COUNTRIES } from '@policyengine/shared';

export default function HeaderNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const countryId = useCurrentCountry();

  const handleNavClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  const handleCountryChange = (newCountryId: string) => {
    navigate(replaceCountryInPath(location.pathname, newCountryId));
  };

  const navItems: NavItemSetup[] = [
    {
      label: 'Research',
      onClick: () => handleNavClick(`/${countryId}/research`),
      hasDropdown: false,
    },
    {
      label: 'About',
      onClick: () => {}, // No-op for dropdown parent
      hasDropdown: true,
      dropdownItems: [
        { label: 'Team', onClick: () => handleNavClick(`/${countryId}/team`) },
        { label: 'Supporters', onClick: () => handleNavClick(`/${countryId}/supporters`) },
      ],
    },
    {
      label: 'Donate',
      onClick: () => handleNavClick(`/${countryId}/donate`),
      hasDropdown: false,
    },
  ];

  return (
    <HomeHeader
      countryId={countryId}
      websiteUrl=""
      navItems={navItems}
      countries={WEBSITE_COUNTRIES}
      onCountryChange={handleCountryChange}
    />
  );
}
