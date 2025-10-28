import { HeroSectionProps } from '@/components/shared/static/HeroSection';

export const TEST_HERO_TITLE = 'Test Hero Title';
export const TEST_HERO_DESCRIPTION = 'This is a test hero description for our static page.';

export const MOCK_HERO_PROPS: HeroSectionProps = {
  title: TEST_HERO_TITLE,
  description: TEST_HERO_DESCRIPTION,
};

export const MOCK_HERO_PROPS_DARK: HeroSectionProps = {
  title: TEST_HERO_TITLE,
  description: TEST_HERO_DESCRIPTION,
  variant: 'dark',
};
