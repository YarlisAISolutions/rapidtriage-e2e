/**
 * Base test fixtures for RapidTriageME E2E suite
 * Re-exports everything from auth fixtures + standard playwright test
 */
export { test, expect } from '@playwright/test';
export type { Page, APIRequestContext, BrowserContext } from '@playwright/test';

// Re-export auth helpers
export {
  TEST_EMAIL,
  TEST_PASSWORD,
  TEST_TOKEN,
  AUTH_STATE_PATH,
} from './auth';
