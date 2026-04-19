/**
 * GitHub Integration Page — rapidtriage.me/github
 * Feature: GitHub repo connection and integration management
 * Run: npx playwright test playwright/flows/pages/github-integration.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { Selectors } from '../../helpers/selectors';

const BASE = process.env.RAPIDTRIAGE_BASE_URL || 'https://rapidtriage.me';

test.describe('GitHub integration page', () => {
  test('page returns 200 or redirects to login', async ({ page }) => {
    const res = await page.goto(`${BASE}/github`);
    await page.waitForLoadState('networkidle');
    const status = res?.status() ?? 0;
    const url = page.url();
    expect(
      status === 200 || url.includes('login'),
      `Expected 200 or login redirect, got ${status} at ${url}`,
    ).toBeTruthy();
  });

  test('github page has expected heading', async ({ page }) => {
    await page.goto(`${BASE}/github`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('login')) {
      test.skip(true, 'Redirected to login — auth required');
    }
    const heading = page.locator('h1, h2, .page-title').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('github page loads without fatal JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/github`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('login')) {
      test.skip(true, 'Redirected to login — auth required');
    }
    const fatal = errors.filter(
      (e) => e.includes('SyntaxError') || e.includes('ReferenceError'),
    );
    expect(fatal).toHaveLength(0);
  });

  test('github page shows sidebar navigation', async ({ page }) => {
    await page.goto(`${BASE}/github`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('login')) {
      test.skip(true, 'Redirected to login — auth required');
    }
    await expect(page.locator(Selectors.sidebar.navGithub)).toBeVisible({ timeout: 10_000 });
  });
});
