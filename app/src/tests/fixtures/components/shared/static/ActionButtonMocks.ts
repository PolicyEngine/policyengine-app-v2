import { ActionButtonProps } from '@/components/shared/static/ActionButton';

export const TEST_BUTTON_TEXT = 'Click Me';
export const TEST_BUTTON_HREF = 'https://example.com';
export const TEST_CAPTION = 'This is a test caption below the button';

export const MOCK_ACTION_BUTTON_PROPS: ActionButtonProps = {
  text: TEST_BUTTON_TEXT,
  href: TEST_BUTTON_HREF,
};

export const MOCK_ACTION_BUTTON_PROPS_WITH_CAPTION: ActionButtonProps = {
  text: TEST_BUTTON_TEXT,
  href: TEST_BUTTON_HREF,
  caption: TEST_CAPTION,
};

export const MOCK_ACTION_BUTTON_PROPS_MULTILINE: ActionButtonProps = {
  text: 'First Line\nSecond Line',
  href: TEST_BUTTON_HREF,
  multiline: true,
};
