import { defineConfig, devices } from '@playwright/test';

const TEST_PORT = Number(process.env.PLAYWRIGHT_PORT || 4173);
const BASE_PATH = process.env.VITE_BASE_PATH || '/';
const normalizedBase = BASE_PATH.endsWith('/') ? BASE_PATH : `${BASE_PATH}/`;

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://127.0.0.1:${TEST_PORT}${normalizedBase}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx vite preview --port ${TEST_PORT} --host 127.0.0.1 --strictPort`,
    url: `http://127.0.0.1:${TEST_PORT}${normalizedBase}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
