import { useNavigate, useLocation } from 'react-router-dom';
import { HomeHeader, NavItemSetup } from '@policyengine/design-system';
import { useCurrentCountry, replaceCountryInPath, COUNTRIES } from '@policyengine/shared';

export default function CalculatorHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const countryId = useCurrentCountry();

  const handleNavClick = (path: string) => {
    navigate(path);
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
      onClick: () => {},
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
      websiteUrl="https://policyengine.org"
      navItems={navItems}
      countries={COUNTRIES}
      onCountryChange={handleCountryChange}
    />
  );
}
