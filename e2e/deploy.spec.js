import { test, expect } from '@playwright/test';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];
const PROTECTED_ROUTES = ['/chat', '/find', '/admin', '/admin/llm', '/admin/prompts'];

test.describe('HPN deploy test', () => {
  test('homepage loads with logo and hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Helping People/);
    await expect(page.locator('.logo')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('homepage shows sign-in and sign-up buttons when logged out', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.btn-ghost').filter({ hasText: /Sign In|Iniciar/ }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.btn-primary').filter({ hasText: /Sign Up|Empieza/ }).first()).toBeVisible();
  });

  test('/login renders email form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.auth-card')).toBeVisible();
  });

  test('/signup renders email form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.auth-card')).toBeVisible();
  });

  test('protected pages redirect to login when unauthenticated', async ({ page }) => {
    for (const route of PROTECTED_ROUTES) {
      await page.goto(route);
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
      expect(page.url()).toContain('/login');
    }
  });

  test('all public routes return HTTP 200', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(resp.status()).toBeLessThan(500);
    }
  });
});
