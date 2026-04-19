/**
 * Marketing Pricing — rapidtriage.me/#pricing
 * Feature: Pricing tiers and amounts
 * Run: npx playwright test playwright/flows/marketing/pricing.spec.ts --project=marketing-flows
 */
import { test, expect } from '../../fixtures/base';
import { Selectors } from '../../helpers/selectors';

test.describe('Marketing pricing section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#pricing');
    await page.waitForLoadState('networkidle');
  });

  test('pricing section loads', async ({ page }) => {
    await expect.soft(page.locator(Selectors.marketing.pricingSection).first()).toBeVisible();
    await expect.soft(page.locator(Selectors.marketing.pricingHeading).first()).toBeVisible();
  });

  test('pricing tiers are displayed', async ({ page }) => {
    const cards = page.locator('.price-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3); // Free, Pro, Team, Enterprise
    // Verify first 3 are visible
    for (let i = 0; i < Math.min(count, 4); i++) {
      await expect.soft(cards.nth(i)).toBeVisible();
    }
  });

  test('pricing amounts are displayed', async ({ page }) => {
    const amounts = page.locator(Selectors.marketing.pricingAmounts);
    const count = await amounts.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

});
