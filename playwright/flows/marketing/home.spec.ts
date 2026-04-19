/**
 * Marketing Home — rapidtriage.me
 * Feature: Landing page content and navigation
 * Run: npx playwright test playwright/flows/marketing/home.spec.ts --project=marketing-flows
 */
import { test, expect } from '../../fixtures/base';
import { Selectors } from '../../helpers/selectors';

test.describe('Marketing home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with 200 status', async ({ page, request, baseURL }) => {
    const res = await request.get(baseURL!);
    expect(res.status()).toBe(200);
  });

  test('page title is not empty', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('hero heading exists', async ({ page }) => {
    await expect.soft(page.locator(Selectors.marketing.heroHeading).first()).toBeVisible();
  });

  test('CTA button exists', async ({ page }) => {
    await expect.soft(page.locator(Selectors.marketing.ctaButton).first()).toBeVisible();
  });

  test('features section is present', async ({ page }) => {
    await expect.soft(page.locator(Selectors.marketing.featuresSection).first()).toBeVisible();
    await expect.soft(page.locator(Selectors.marketing.featuresHeading).first()).toBeVisible();
  });

  test('navigation links are present', async ({ page }) => {
    const signIn = page.locator(Selectors.nav.signInLink).first();
    const pricing = page.locator(Selectors.nav.pricingLink).first();
    await expect.soft(signIn).toBeVisible();
    await expect.soft(pricing).toBeVisible();
  });

});
