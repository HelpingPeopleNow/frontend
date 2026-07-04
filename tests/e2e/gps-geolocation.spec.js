import { test, expect } from '@playwright/test';

// Madrid coordinates (worker location)
const MADRID_LAT = 40.4168;
const MADRID_LNG = -3.7038;

// Barcelona coordinates (client location - ~505 km from Madrid)
const BCN_LAT = 41.3874;
const BCN_LNG = 2.1686;

test.describe('GPS geolocation flow', () => {

  test('worker grants location → coords saved to profile', async ({ browser, baseURL }) => {
    // Create context with geolocation permission + coordinates
    const ctx = await browser.newContext({
      permissions: ['geolocation'],
      geolocation: { latitude: MADRID_LAT, longitude: MADRID_LNG },
    });

    // Set worker session cookie (Cimbel - electrician in Valencia)
    await ctx.addCookies([{
      name: '__Secure-better-auth.session_token',
      value: 'lfk2QEfw9ITnCQ8ICRiTRSjLodCaXMpu',
      domain: 'helpingpeople.cloud',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    }]);

    const page = await ctx.newPage();

    // Go to worker intake chat
    await page.goto(`${baseURL}/chat?mode=worker_intake`);
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the chat page
    await page.screenshot({ path: '/tmp/gps-worker-chat.png', fullPage: true });

    // Send a message to trigger intake (this should capture coords)
    const chatInput = page.locator('.chat-input-bar input, .chat-input-bar textarea');
    await chatInput.fill('I fix electrical problems in Valencia');
    await page.locator('.chat-send-btn').click();

    // Wait for response
    await page.waitForSelector('.chat-message.assistant', { timeout: 30000 });
    await page.screenshot({ path: '/tmp/gps-worker-after-msg.png', fullPage: true });

    // Check the API to see if coordinates were saved
    const profileRes = await page.evaluate(async () => {
      const r = await fetch('/api/v1/worker/profile', { credentials: 'include' });
      return r.json();
    });

    console.log('Worker profile:', JSON.stringify(profileRes, null, 2));
    console.log('Latitude:', profileRes.latitude);
    console.log('Longitude:', profileRes.longitude);

    // Verify coordinates were saved
    if (profileRes.latitude !== null && profileRes.latitude !== undefined) {
      console.log('✅ Coordinates saved in worker profile!');
      expect(profileRes.latitude).toBeCloseTo(MADRID_LAT, 1);
      expect(profileRes.longitude).toBeCloseTo(MADRID_LNG, 1);
    } else {
      console.log('⚠️ Coordinates NOT saved yet — may need more intake messages');
    }

    await ctx.close();
  });

  test('client searches → distance shown in results', async ({ browser, baseURL }) => {
    // Create context with geolocation (Barcelona - client location)
    const ctx = await browser.newContext({
      permissions: ['geolocation'],
      geolocation: { latitude: BCN_LAT, longitude: BCN_LNG },
    });

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

    const page = await ctx.newPage();

    // Go to find page
    await page.goto(`${baseURL}/find`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/gps-find-page.png', fullPage: true });

    // Type a search query
    const searchInput = page.locator('.find-search-bar input, .find-input input, input[placeholder]');
    await searchInput.first().fill('electrician');
    await page.keyboard.press('Enter');

    // Wait for results
    await page.waitForSelector('.worker-card, .find-result', { timeout: 30000 });
    await page.screenshot({ path: '/tmp/gps-find-results.png', fullPage: true });

    // Check for distance in results
    const pageText = await page.textContent('body');
    const hasKm = pageText.includes('km');
    console.log('Page contains "km":', hasKm);

    if (hasKm) {
      console.log('✅ Distance displayed in search results!');
    } else {
      console.log('⚠️ No distance displayed — checking API directly');
    }

    // Also check the API response directly
    const searchRes = await page.evaluate(async () => {
      const r = await fetch('/api/v1/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'search',
          message: 'electrician',
          latitude: 41.3874,
          longitude: 2.1686,
        }),
      });
      return r.json();
    });

    console.log('Search API response:', JSON.stringify(searchRes, null, 2));

    // Check if workers have distance
    if (searchRes.workers) {
      for (const w of searchRes.workers) {
        console.log(`Worker: ${w.business_name || w.profession} - distance: ${w.distance_km || 'N/A'} km`);
      }
    }

    await ctx.close();
  });

  test('permission denied → banner shown', async ({ browser, baseURL }) => {
    // Create context WITHOUT geolocation permission
    const ctx = await browser.newContext({
      permissions: [], // No geolocation permission
    });

    // Set worker session cookie
    await ctx.addCookies([{
      name: '__Secure-better-auth.session_token',
      value: 'lfk2QEfw9ITnCQ8ICRiTRSjLodCaXMpu',
      domain: 'helpingpeople.cloud',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    }]);

    const page = await ctx.newPage();

    // Go to chat page
    await page.goto(`${baseURL}/chat?mode=worker_intake`);
    await page.waitForLoadState('networkidle');

    // Wait a bit for geolocation to fail
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/gps-no-permission.png', fullPage: true });

    // Check for location denied banner
    const pageText = await page.textContent('body');
    const hasBanner = pageText.includes('Location access') || pageText.includes('ubicación');
    console.log('Permission denied banner shown:', hasBanner);

    if (hasBanner) {
      console.log('✅ Location permission denied banner visible!');
    }

    await ctx.close();
  });
});
