import { test, expect } from '@playwright/test';

// Production-only spec: uses hardcoded session cookies for helpingpeople.cloud.
// Skipped in CI unless PLAYWRIGHT_INCLUDE_PROD=1 (see playwright.config.js).

test.describe('Chat intake flow', () => {

  test('worker intake — chat UI loads and sends a message', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Set worker session cookie (Cimbel - electrician)
    await ctx.addCookies([{
      name: '__Secure-better-auth.session_token',
      value: 'lfk2QEfw9ITnCQ8ICRiTRSjLodCaXMpu',
      domain: 'helpingpeople.cloud',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    }]);

    // Navigate to worker intake chat
    await page.goto(`${baseURL}/chat?mode=worker_intake`);
    await page.waitForLoadState('networkidle');

    // Verify the chat page loaded with expected elements
    await expect(page.locator('.chat-container')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.chat-input-bar')).toBeVisible({ timeout: 5000 });

    // Verify the welcome screen (no messages yet)
    const welcome = page.locator('.chat-welcome');
    if (await welcome.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ Chat welcome screen visible');
    }

    // Type a message and send
    const chatInput = page.locator('.chat-input-bar input, .chat-input-bar textarea').first();
    await chatInput.fill('Hello, I am an electrician. Tell me about your platform.');
    await page.locator('.chat-send-btn').click();

    // Wait for the AI response (assistant bubble)
    await page.waitForSelector('.chat-bubble-assistant', { timeout: 30000 });
    console.log('✅ AI response received');

    // Take a screenshot for verification
    await page.screenshot({ path: '/tmp/e2e-worker-intake.png', fullPage: true });

    // Verify the message list is populated
    const messages = await page.locator('.chat-bubble').count();
    console.log(`Chat messages visible: ${messages}`);
    expect(messages).toBeGreaterThanOrEqual(2); // user + assistant

    await ctx.close();
  });

  test('client intake — chat UI loads and handles profile questions', async ({ browser, baseURL }) => {
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

    // Navigate to client intake chat
    await page.goto(`${baseURL}/chat?mode=client_intake`);
    await page.waitForLoadState('networkidle');

    // Verify the chat page loaded
    await expect(page.locator('.chat-container')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.chat-input-bar')).toBeVisible({ timeout: 5000 });

    // Type a message describing a home need
    const chatInput = page.locator('.chat-input-bar input, .chat-input-bar textarea').first();
    await chatInput.fill('I need a plumber to fix a leak in my bathroom. Can you help?');
    await page.locator('.chat-send-btn').click();

    // Wait for AI response
    await page.waitForSelector('.chat-bubble-assistant', { timeout: 30000 });
    console.log('✅ Client intake AI response received');

    await page.screenshot({ path: '/tmp/e2e-client-intake.png', fullPage: true });

    const messages = await page.locator('.chat-bubble').count();
    console.log(`Chat messages visible: ${messages}`);
    expect(messages).toBeGreaterThanOrEqual(2);

    await ctx.close();
  });
});
