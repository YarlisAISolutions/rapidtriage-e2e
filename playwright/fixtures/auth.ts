/**
 * Shared authentication fixtures for RapidTriageME E2E tests
 *
 * Provides reusable helpers and Playwright fixtures for authenticated
 * test scenarios. Reads credentials from environment variables:
 *
 *   TEST_EMAIL          – login email           (default: demo@example.com)
 *   TEST_PASSWORD       – login password         (default: demo1234)
 *   RAPIDTRIAGE_TEST_TOKEN – bearer token for API tests
 *   RAPIDTRIAGE_BASE_URL   – site base URL
 */

import { test as base, expect, Page, APIRequestContext } from '@playwright/test';
import path from 'path';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

export const AUTH_STATE_PATH = path.join(__dirname, '..', '.auth', 'user.json');

export const TEST_EMAIL = process.env.TEST_EMAIL ?? 'demo@example.com';
export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'demo1234';
export const TEST_TOKEN = process.env.RAPIDTRIAGE_TEST_TOKEN;

/* ------------------------------------------------------------------ */
/*  Helper: login via the UI                                          */
/* ------------------------------------------------------------------ */

/**
 * Fill in the login form and submit. Waits for the success alert or
 * a dashboard redirect before returning.
 */
export async function loginWithEmail(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  // Navigate to login page
  await page.goto('/login');

  // Ensure the Sign In tab is active
  const signInTab = page.getByRole('button', { name: /Sign In/i });
  if (await signInTab.isVisible()) {
    await signInTab.click();
  }

  // Fill credentials
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  // Submit the form
  await page.locator('#btn').click();

  // Wait for either redirect or success alert
  await Promise.race([
    page.waitForURL('**/dashboard**', { timeout: 15_000 }),
    page.locator('.alert-success').waitFor({ state: 'visible', timeout: 15_000 }),
  ]).catch(() => {
    // Let the calling test decide how to handle failures
  });
}

/* ------------------------------------------------------------------ */
/*  Custom Playwright fixtures                                        */
/* ------------------------------------------------------------------ */

type AuthFixtures = {
  /** A Page that already has auth state (from storageState). */
  authenticatedPage: Page;
  /** An APIRequestContext that sends the Bearer token. */
  apiContext: APIRequestContext;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE_PATH,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  apiContext: async ({ playwright }, use) => {
    const baseURL = process.env.RAPIDTRIAGE_BASE_URL || 'https://rapidtriage.me';
    const token = TEST_TOKEN;

    const ctx = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect };
