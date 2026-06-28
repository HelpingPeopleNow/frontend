import { test, expect } from '@playwright/test';

test('two users chat flow - inbox loads and SSE connects', async ({ browser, baseURL }) => {
  const goodbytesCtx = await browser.newContext();
  const hugoCtx = await browser.newContext();
  
  const goodbytesPage = await goodbytesCtx.newPage();
  const hugoPage = await hugoCtx.newPage();

  // Set session cookies manually (Secure cookies for production)
  await goodbytesCtx.addCookies([{
    name: '__Secure-better-auth.session_token',
    value: 'lfk2QEfw9ITnCQ8ICRiTRSjLodCaXMpu',
    domain: 'helpingpeople.cloud',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }]);
  
  await hugoCtx.addCookies([{
    name: '__Secure-better-auth.session_token',
    value: 'WDF3nhfVpreDIl4NccShkxcSfPzNtnz0',
    domain: 'helpingpeople.cloud',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }]);

  // Check inbox loads for both users
  await goodbytesPage.goto(`${baseURL}/inbox`);
  await hugoPage.goto(`${baseURL}/inbox`);

  // Wait for conversations to load
  await goodbytesPage.waitForSelector('.dm-conv-item', { timeout: 10000 });
  await hugoPage.waitForSelector('.dm-conv-item', { timeout: 10000 });

  // Count conversations
  const goodbytesConvs = await goodbytesPage.$$('.dm-conv-item');
  const hugoConvs = await hugoPage.$$('.dm-conv-item');

  console.log(`Goodbytes sees ${goodbytesConvs.length} conversations`);
  console.log(`Hugo sees ${hugoConvs.length} conversations`);

  // Both should see conversations
  expect(goodbytesConvs.length).toBeGreaterThan(0);
  expect(hugoConvs.length).toBeGreaterThan(0);

  // Open the first conversation (click on it)
    await goodbytesPage.click('.dm-conv-item:first-child');
    await hugoPage.click('.dm-conv-item:first-child');

    // Wait for conversation page to load
    await goodbytesPage.waitForURL(/\/inbox\/.+/);
    await hugoPage.waitForURL(/\/inbox\/.+/);

    console.log('Both users have opened conversation');

    // Send a message from Hugo (message input and button selectors)
    await hugoPage.fill('.dm-input-bar input', 'Test message from Hugo at ' + Date.now());
    await hugoPage.click('.dm-send-btn');

  // Wait for message to appear on Hugo side
  await hugoPage.waitForSelector('.dm-message:has-text("Test message from Hugo")', { timeout: 5000 });

  // Wait for SSE to deliver to Goodbytes (poll fallback if SSE fails)
  await goodbytesPage.waitForSelector('.dm-message:has-text("Test message from Hugo")', { timeout: 15000 });

  console.log('Message delivered via SSE/polling');

  // Cleanup
  await goodbytesCtx.close();
  await hugoCtx.close();
});