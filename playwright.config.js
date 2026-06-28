import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'https://helpingpeople.cloud',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
});
