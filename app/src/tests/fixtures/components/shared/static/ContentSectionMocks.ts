import { ContentSectionProps } from '@/components/shared/static/ContentSection';

export const TEST_SECTION_TITLE = 'Test Section Title';
export const TEST_SECTION_CONTENT = 'Section content text';

export const MOCK_CONTENT_SECTION_PROPS: Omit<ContentSectionProps, 'children'> = {
  title: TEST_SECTION_TITLE,
  variant: 'secondary',
};

export const MOCK_CONTENT_SECTION_PROPS_ACCENT: Omit<ContentSectionProps, 'children'> = {
  title: TEST_SECTION_TITLE,
  variant: 'accent',
  centerTitle: true,
};
