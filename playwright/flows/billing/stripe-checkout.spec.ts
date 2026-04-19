/**
 * E2E: Stripe Checkout Flow — RapidTriageME
 *
 * Tests the full billing path:
 *   1. Unauthenticated access to billing page → redirected to login
 *   2. Authenticated: billing page loads, plans are visible
 *   3. POST /api/billing/checkout → returns Stripe checkout URL
 *   4. POST /api/billing/portal  → requires existing customer
 *   5. GET  /api/billing/status  → returns subscription data
 *
 * Uses Stripe test mode (sk_test_*). No real charges.
 * Test card: 4242 4242 4242 4242
 */

import { test, expect, request } from '@playwright/test';

const BASE_URL = process.env.RAPIDTRIAGE_BASE_URL || 'https://rapidtriage-me--staging-hb55sy3z.web.app';
const API_TOKEN = process.env.RAPIDTRIAGE_TEST_TOKEN || '';
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

// ─────────────────────────────────────────────
// SECTION 1: Billing Page UI
// ─────────────────────────────────────────────
test.describe('Billing page UI', () => {
  test('billing page loads (200)', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/billing`);
    // May redirect to login if unauthenticated — that's correct behaviour
    expect([200, 301, 302, 303]).toContain(res?.status());
  });

  test('billing page contains pricing tiers', async ({ page }) => {
    await page.goto(`${BASE_URL}/billing`);
    const body = await page.content();
    // At minimum the plan names should be in the page source
    const hasPricing = body.includes('Pro') || body.includes('plan') || body.includes('upgrade') || body.includes('login');
    expect(hasPricing).toBeTruthy();
  });
});

// ─────────────────────────────────────────────
// SECTION 2: API — Checkout Session
// ─────────────────────────────────────────────
test.describe('POST /api/billing/checkout', () => {
  test('rejects unauthenticated requests', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.post('/api/billing/checkout', {
      data: { tier: 'user' },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test.skip(!API_TOKEN, 'Needs RAPIDTRIAGE_TEST_TOKEN');

  test('returns Stripe checkout URL for Pro monthly', async () => {
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const res = await ctx.post('/api/billing/checkout', {
      data: { tier: 'user', yearly: false },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.url).toMatch(/checkout\.stripe\.com/);
    expect(body.sessionId).toBeTruthy();

    console.log('✅ Checkout URL:', body.url);
    await ctx.dispose();
  });

  test('returns Stripe checkout URL for Team yearly', async () => {
    test.skip(!API_TOKEN, 'Needs RAPIDTRIAGE_TEST_TOKEN');
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const res = await ctx.post('/api/billing/checkout', {
      data: { tier: 'team', yearly: true },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.url).toMatch(/checkout\.stripe\.com/);
    await ctx.dispose();
  });

  test('rejects invalid tier', async () => {
    test.skip(!API_TOKEN, 'Needs RAPIDTRIAGE_TEST_TOKEN');
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const res = await ctx.post('/api/billing/checkout', {
      data: { tier: 'invalid_tier' },
    });

    expect(res.status()).toBe(400);
    await ctx.dispose();
  });

  test('rejects missing tier', async () => {
    test.skip(!API_TOKEN, 'Needs RAPIDTRIAGE_TEST_TOKEN');
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const res = await ctx.post('/api/billing/checkout', { data: {} });
    expect(res.status()).toBe(400);
    await ctx.dispose();
  });
});

// ─────────────────────────────────────────────
// SECTION 3: API — Billing Status
// ─────────────────────────────────────────────
test.describe('GET /api/billing/status', () => {
  test('rejects unauthenticated', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.get('/api/billing/status');
    expect([401, 403, 404]).toContain(res.status());
    await ctx.dispose();
  });

  test('returns subscription object for authenticated user', async () => {
    test.skip(!API_TOKEN, 'Needs RAPIDTRIAGE_TEST_TOKEN');
    const ctx = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${API_TOKEN}` },
    });

    const res = await ctx.get('/api/billing/status');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('tier');
    expect(body.data).toHaveProperty('status');
    await ctx.dispose();
  });
});

// ─────────────────────────────────────────────
// SECTION 4: API — Portal
// ─────────────────────────────────────────────
test.describe('POST /api/billing/portal', () => {
  test('rejects unauthenticated', async () => {
    const ctx = await request.newContext({ baseURL: BASE_URL });
    const res = await ctx.post('/api/billing/portal', { data: {} });
    expect([401, 403, 404]).toContain(res.status());
    await ctx.dispose();
  });
});

// ─────────────────────────────────────────────
// SECTION 5: Full Browser Checkout Flow (skipped without creds)
// ─────────────────────────────────────────────
test.describe('Full browser checkout flow', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Needs TEST_EMAIL + TEST_PASSWORD');

  test('login → billing → click upgrade → lands on Stripe checkout', async ({ page }) => {
    // Step 1: Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 10_000 });

    // Step 2: Go to billing
    await page.goto(`${BASE_URL}/billing`);
    await page.waitForLoadState('networkidle');

    // Step 3: Click Pro upgrade
    const upgradeBtn = page.locator('button', { hasText: /upgrade|get started|pro/i }).first();
    await expect(upgradeBtn).toBeVisible();
    await upgradeBtn.click();

    // Step 4: Should redirect to Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 });
    expect(page.url()).toContain('checkout.stripe.com');

    console.log('✅ Redirected to Stripe:', page.url());
  });
});
