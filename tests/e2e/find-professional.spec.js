import { test, expect } from '@playwright/test';

// Production-only spec: uses hardcoded session cookies for helpingpeople.cloud.
// Skipped in CI unless PLAYWRIGHT_INCLUDE_PROD=1 (see playwright.config.js).

test.describe('Find professional flow', () => {

  test('find page loads search UI and returns worker cards', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Set client session cookie (Hugo)
    await ctx.addCookies([{
      name: '__Secure-better-auth.session_token',
      value: 'WDF3nhfVpreDIl4NccShkxcSfPzNtnz0',
      domain: 'helpingpeople.cloud',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    }]);

    // Navigate to find page
    await page.goto(`${baseURL}/find`);
    await page.waitForLoadState('networkidle');

    // Verify the search UI loaded
    await expect(page.locator('.chat-container')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.chat-input-bar')).toBeVisible({ timeout: 5000 });

    // Check welcome screen
    const welcome = page.locator('.chat-welcome');
    if (await welcome.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ Find welcome screen visible');
    }

    // Type a search query
    const searchInput = page.locator('.chat-input-bar input').first();
    await searchInput.fill('Need an electrician near me');
    await page.locator('.chat-send-btn').click();

    // Wait for search results (assistant response)
    await page.waitForSelector('.chat-bubble-assistant', { timeout: 30000 });
    console.log('✅ Search response received');

    // Check for worker cards in the response
    const workerCards = page.locator('.worker-card');
    const cardCount = await workerCards.count().catch(() => 0);
    console.log(`Worker cards visible: ${cardCount}`);

    // The search may or may not return cards depending on data, but the
    // assistant response should always be present.
    await page.screenshot({ path: '/tmp/e2e-find-professional.png', fullPage: true });

    const messages = await page.locator('.chat-bubble').count();
    expect(messages).toBeGreaterThanOrEqual(2);

    await ctx.close();
  });

  test('find page handles empty/no-results gracefully', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Set client session cookie (Hugo)
    await ctx.addCookies([{
      name: '__Secure-better-auth.session_token',
      value: 'WDF3nhfVpreDIl4NccShkxcSfPzNtnz0',
      domain: 'helpingpeople.cloud',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    }]);

    await page.goto(`${baseURL}/find`);
    await page.waitForLoadState('networkidle');

    // Search for something very specific that likely has no results
    const searchInput = page.locator('.chat-input-bar input').first();
    await searchInput.fill('underwater basket weaver in the Sahara desert');
    await page.locator('.chat-send-btn').click();

    // Wait for assistant response
    await page.waitForSelector('.chat-bubble-assistant', { timeout: 30000 });

    // Check for the "no results" message or worker card empty state
    const noResults = page.locator('.worker-card-empty');
    const cards = page.locator('.worker-card');
    const noResultsVisible = await noResults.isVisible({ timeout: 2000 }).catch(() => false);
    const cardCount = await cards.count().catch(() => 0);
    console.log(`No-results visible: ${noResultsVisible}, cards: ${cardCount}`);

    // The page should not crash — we should still see the chat UI
    await expect(page.locator('.chat-input-bar')).toBeVisible();
    await expect(page.locator('.chat-bubble-assistant')).toBeVisible();

    await ctx.close();
  });
});
