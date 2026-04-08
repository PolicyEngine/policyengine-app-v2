import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders correctly @visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
    });
  });
});
