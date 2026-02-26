import { Text } from '@mantine/core';
import { HeroSectionProps } from '@/components/shared/static/HeroSection';

export const MOCK_HERO_PROPS_WITH_REACT_NODE: HeroSectionProps = {
  title: 'Test Hero Title',
  description: (
    <Text component="span">
      This is a test with <strong>bold text</strong> included.
    </Text>
  ),
};
