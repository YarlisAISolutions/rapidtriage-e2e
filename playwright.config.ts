import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.RAPIDTRIAGE_BASE_URL || 'https://rapidtriage.me';

export default defineConfig({
  testDir: './playwright',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    actionTimeout: process.env.CI ? 30000 : 15000,
    navigationTimeout: process.env.CI ? 45000 : 30000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'api', testMatch: /flows\/api\/.*\.spec\.ts/, use: { browserName: 'chromium' } },
    { name: 'auth', testMatch: /flows\/auth\/.*\.spec\.ts/, use: devices['Desktop Chrome'] },
    { name: 'marketing', testMatch: /flows\/marketing\/.*\.spec\.ts/, use: devices['Desktop Chrome'] },
    { name: 'billing', testMatch: /flows\/billing\/.*\.spec\.ts/, use: devices['Desktop Chrome'] },
    { name: 'triage', testMatch: /flows\/triage\/.*\.spec\.ts/, use: devices['Desktop Chrome'] },
    { name: 'protected', testMatch: /flows\/protected\/.*\.spec\.ts/, use: devices['Desktop Chrome'] },
    { name: 'pages', testMatch: /flows\/pages\/.*\.spec\.ts/, use: devices['Desktop Chrome'] },
    { name: 'onboarding', testMatch: /flows\/onboarding\/.*\.spec\.ts/, use: devices['Desktop Chrome'] },
  ],
});
