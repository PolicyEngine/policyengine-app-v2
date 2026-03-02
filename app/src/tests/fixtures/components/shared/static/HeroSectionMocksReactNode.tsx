import { HeroSectionProps } from '@/components/shared/static/HeroSection';
import { Text } from '@/components/ui';

export const MOCK_HERO_PROPS_WITH_REACT_NODE: HeroSectionProps = {
  title: 'Test Hero Title',
  description: (
    <Text component="span">
      This is a test with <strong>bold text</strong> included.
    </Text>
  ),
};
