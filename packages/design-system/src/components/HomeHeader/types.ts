export interface DropdownItem {
  label: string;
  onClick: () => void;
}

export interface NavItemSetup {
  label: string;
  onClick: () => void;
  hasDropdown: boolean;
  dropdownItems?: DropdownItem[];
}

export interface Country {
  id: string;
  label: string;
}

export interface HomeHeaderProps {
  /** Current country ID from URL */
  countryId: string;
  /** Base URL for the website (e.g., 'https://policyengine.org') */
  websiteUrl: string;
  /** Navigation items to display */
  navItems: NavItemSetup[];
  /** Available countries for selector */
  countries: Country[];
  /** Callback when country is changed */
  onCountryChange: (countryId: string) => void;
}
