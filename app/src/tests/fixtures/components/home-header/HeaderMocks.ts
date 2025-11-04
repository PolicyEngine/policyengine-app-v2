/**
 * Legacy header mocks - kept for backwards compatibility
 * New tests should use MOCK_NAV_ITEMS from HomeMocks.ts
 */

export const EXPECTED_HEADER_TEXT = {
  HOME: 'Home',
  BLOG: 'Blog',
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
