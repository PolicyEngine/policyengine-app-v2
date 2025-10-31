export const MOCK_ORG_LOGO_US = '/mock/logo/us.png';
export const MOCK_ORG_LOGO_UK = '/mock/logo/uk.svg';

export const MOCK_ORG_DATA = {
  uk: {
    org1: {
      name: 'UK Organization 1',
      logo: MOCK_ORG_LOGO_UK,
      link: 'https://uk-org1.example.com',
    },
    org2: {
      name: 'UK Organization 2',
      logo: MOCK_ORG_LOGO_UK,
      link: 'https://uk-org2.example.com',
    },
  },
  us: {
    org1: {
      name: 'US Organization 1',
      logo: MOCK_ORG_LOGO_US,
      link: 'https://us-org1.example.com',
    },
    org2: {
      name: 'US Organization 2',
      logo: MOCK_ORG_LOGO_US,
      link: 'https://us-org2.example.com',
    },
  },
};

export const MOCK_ORGS_ARRAY_US = Object.values(MOCK_ORG_DATA.us);
export const MOCK_ORGS_ARRAY_UK = Object.values(MOCK_ORG_DATA.uk);
