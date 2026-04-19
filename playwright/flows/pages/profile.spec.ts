/**
 * Profile Page — rapidtriage.me/profile
 * Feature: User profile, tabs (General, Security, Subscription, Usage)
 * Run: npx playwright test playwright/flows/pages/profile.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { Selectors } from '../../helpers/selectors';

const BASE = process.env.RAPIDTRIAGE_BASE_URL || 'https://rapidtriage.me';

test.describe('Profile page', () => {
  test('page returns 200 or redirects to login', async ({ page }) => {
    const res = await page.goto(`${BASE}/profile`);
    await page.waitForLoadState('networkidle');
    const status = res?.status() ?? 0;
    const url = page.url();
    expect(
      status === 200 || url.includes('login'),
      `Expected 200 or login redirect, got ${status} at ${url}`,
    ).toBeTruthy();
  });

  test('profile page has expected heading', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('login')) {
      test.skip(true, 'Redirected to login — auth required');
    }
    const heading = page.locator('h1, h2, .page-title').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('profile page loads without fatal JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('login')) {
      test.skip(true, 'Redirected to login — auth required');
    }
    const fatal = errors.filter(
      (e) => e.includes('SyntaxError') || e.includes('ReferenceError'),
    );
    expect(fatal).toHaveLength(0);
  });

  test('profile page shows profile avatar', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('login')) {
      test.skip(true, 'Redirected to login — auth required');
    }
    await expect(page.locator(Selectors.profile.profileAvatar)).toBeVisible({ timeout: 10_000 });
  });

  test('profile page shows tab navigation buttons', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('login')) {
      test.skip(true, 'Redirected to login — auth required');
    }
    // Tab buttons/links, not tab content panels
    const tabNav = page.locator('.tab-nav, .tabs, [role="tablist"]').first();
    await expect(tabNav).toBeVisible({ timeout: 10_000 });
    // The general tab content should be visible by default
    await expect(page.locator(Selectors.profile.generalTab)).toBeVisible({ timeout: 10_000 });
  });

  test('profile page shows profile form', async ({ page }) => {
    await page.goto(`${BASE}/profile`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('login')) {
      test.skip(true, 'Redirected to login — auth required');
    }
    await expect(page.locator(Selectors.profile.profileForm)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(Selectors.profile.inputName)).toBeVisible();
    await expect(page.locator(Selectors.profile.inputEmail)).toBeVisible();
  });
});
