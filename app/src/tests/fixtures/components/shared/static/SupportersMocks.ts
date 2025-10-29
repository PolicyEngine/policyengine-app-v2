import { Supporter } from '@/components/shared/static/SupporterCard';
import { SupportedProject } from '@/components/shared/static/SupportedProject';

export const TEST_SUPPORTER: Supporter = {
  id: 'test-org',
  name: 'Test Organization',
  websiteUrl: 'https://test.org/',
  logoUrl: '/assets/supporters/test-org.png',
  description: 'a test organization supporting important causes.',
};

export const TEST_SUPPORTER_NO_LOGO: Supporter = {
  id: 'no-logo-org',
  name: 'No Logo Organization',
  websiteUrl: 'https://nologo.org/',
  description: 'an organization without a logo.',
};

export const TEST_PROJECT_USD: SupportedProject = {
  title: 'Test Project',
  projectUrl: 'https://test.org/project',
  amount: 100000,
  currency: 'USD',
  awardDate: '2024-06',
  description: 'Supporting test activities for quality assurance.',
  supporterId: 'test-org',
};

export const TEST_PROJECT_GBP: SupportedProject = {
  title: 'UK Test Project',
  amount: 75000,
  currency: 'GBP',
  awardDate: '2024-03',
  description: 'Supporting UK-based testing initiatives.',
  supporterId: 'test-org',
};

export const TEST_PROJECT_NO_URL: SupportedProject = {
  title: 'Internal Project',
  amount: 50000,
  currency: 'USD',
  awardDate: '2023-12',
  description: 'An internal project without a public URL.',
  supporterId: 'no-logo-org',
};

export const TEST_PROJECTS: SupportedProject[] = [
  TEST_PROJECT_USD,
  TEST_PROJECT_GBP,
  TEST_PROJECT_NO_URL,
];

// Constants for formatting tests
export const FORMATTED_DATE_JUNE_2024 = 'June 2024';
export const FORMATTED_DATE_MARCH_2024 = 'March 2024';
export const FORMATTED_DATE_DECEMBER_2023 = 'December 2023';

export const FORMATTED_AMOUNT_USD = '$100,000';
export const FORMATTED_AMOUNT_GBP = '£75,000';

// Exchange rate constant
export const GBP_TO_USD_RATE = 1.33;

// Helper to calculate USD equivalent for sorting
export const toUSD = (amount: number, currency: 'USD' | 'GBP'): number => {
  return currency === 'GBP' ? amount * GBP_TO_USD_RATE : amount;
};
