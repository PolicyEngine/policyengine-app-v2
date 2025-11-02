import { vi } from 'vitest';

export const MOCK_PAGE_CONTENT = 'Page Content';

export const mockReactRouterDom = () => {
  return vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      Outlet: () => <div>{MOCK_PAGE_CONTENT}</div>,
    };
  });
};

export const EXPECTED_LAYOUT_TEXT = {
  ABOUT: 'About',
  DONATE: 'Donate',
  PAGE_CONTENT: MOCK_PAGE_CONTENT,
} as const;
