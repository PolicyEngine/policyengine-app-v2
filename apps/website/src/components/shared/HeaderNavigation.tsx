/**
 * Website-specific header navigation wrapper
 * Wraps the design-system HomeHeader with website-specific logic
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeHeader, NavItemSetup, Country } from '@policyengine/design-system';
import { useCurrentCountry, replaceCountryInPath } from '@policyengine/shared';
import { WEBSITE_URL } from '@/constants';

const countries: Country[] = [
  { id: 'us', label: 'United States' },
  { id: 'uk', label: 'United Kingdom' },
];

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
      websiteUrl={WEBSITE_URL}
      navItems={navItems}
      countries={countries}
      onCountryChange={handleCountryChange}
    />
  );
}
