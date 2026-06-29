import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  // Production-only specs (hardcoded session cookies for helpingpeople.cloud,
  // or any test that needs the live backend) are skipped by default so CI
  // runs only the portable, preview-compatible subset. To run them locally
  // against prod, set PLAYWRIGHT_INCLUDE_PROD=1.
  testIgnore: process.env.PLAYWRIGHT_INCLUDE_PROD === '1'
    ? '**/__manual__/**'
    : '**/two-user-chat.spec.js',
  use: {
    baseURL: 'https://helpingpeople.cloud',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
});
