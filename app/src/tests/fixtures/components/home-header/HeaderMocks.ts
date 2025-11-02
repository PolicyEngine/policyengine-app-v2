export const MOCK_NAV_LINKS = [{ label: 'Donate', path: '/us/donate' }];

export const MOCK_ABOUT_LINKS = [
  { label: 'Team', path: '/us/team' },
  { label: 'Supporters', path: '/us/supporters' },
];

export const MOCK_HEADER_PROPS = {
  opened: false,
  onOpen: () => {},
  onClose: () => {},
  navLinks: MOCK_NAV_LINKS,
  aboutLinks: MOCK_ABOUT_LINKS,
  onNavClick: () => {},
} as const;

export const EXPECTED_HEADER_TEXT = {
  ABOUT: 'About',
  DONATE: 'Donate',
  TEAM: 'Team',
  SUPPORTERS: 'Supporters',
} as const;

export const EXPECTED_HEADER_STYLES = {
  position: 'sticky',
  top: '0',
  width: '100%',
} as const;
