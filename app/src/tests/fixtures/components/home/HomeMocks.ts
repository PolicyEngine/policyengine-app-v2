export const MOCK_NAV_LINKS = [{ label: 'Donate', path: '/us/donate' }];

export const MOCK_ABOUT_LINKS = [
  { label: 'Team', path: '/us/team' },
  { label: 'Supporters', path: '/us/supporters' },
];

export const MOCK_LEARN_LINKS = [{ label: 'API', path: '/us/api' }];

export const EXPECTED_TEXT = {
  US: {
    HERO_TITLE: 'Computing public policy for everyone',
    SUBTITLE: 'Understand and analyze the impacts of tax and benefit policies',
    TRANSFORMATION: 'Transforming how policy professionals analyze and implement',
  },
  UK: {
    HERO_TITLE: 'Computing public policy for everyone',
    SUBTITLE: 'Understand and analyse the impacts of tax and benefit policies',
    TRANSFORMATION: 'Transforming how policy professionals analyse and implement',
  },
} as const;
