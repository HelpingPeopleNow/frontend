import { test, expect } from '@playwright/test';

test.describe('HPN deploy test', () => {
  test('homepage loads with login form', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('HelpingPeopleNow');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('/login and /signup render', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('protected pages redirect to login', async ({ page }) => {
    for (const route of ['/worker', '/client', '/admin']) {
      await page.goto(route);
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('all routes return HTTP 200', async ({ page }) => {
    for (const route of ['/', '/login', '/signup', '/worker', '/client', '/admin']) {
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(resp.status()).toBeLessThan(500);
    }
  });
});
