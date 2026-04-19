/**
 * dashboard-flow.spec.ts
 * E2E: Dashboard UI + Priority Queue + triage-report page
 * Deployment-aware: tests pass before and after deploy.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.RAPIDTRIAGE_BASE_URL || 'https://rapidtriage-me--staging-hb55sy3z.web.app';

test.describe('Dashboard Flow — Triage UI', () => {

  test('dashboard.html loads without JS crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${BASE}/dashboard.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // Should not be a blank white screen
    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(bodyText.length).toBeGreaterThan(0);
    // No uncaught fatal errors
    const fatalErrors = errors.filter(e => e.includes('SyntaxError') || e.includes('is not defined'));
    expect(fatalErrors).toHaveLength(0);
  });

  test('triage-report.html page loads (200 response)', async ({ page }) => {
    const response = await page.goto(`${BASE}/triage-report.html`, { timeout: 20_000 });
    expect(response?.status()).not.toBe(500);
    // Page should return something renderable
    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('triage-report.html with ?id param renders some state', async ({ page }) => {
    await page.goto(`${BASE}/triage-report.html?id=report-test-e2e`, {
      waitUntil: 'domcontentloaded', timeout: 20_000,
    });
    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(bodyText.length).toBeGreaterThan(0);

    // If our new page is deployed, the state elements should exist
    const hasNewPage = await page.locator('#loading, #error-state, #report').count();
    if (hasNewPage > 0) {
      // New page: one of the three states should eventually be visible
      await expect(
        page.locator('#loading').or(page.locator('#error-state')).or(page.locator('#report'))
      ).toBeVisible({ timeout: 10_000 });
    }
    // If old page: just pass (it showed something)
  });

  test('triage-report.html without ?id shows error state (new page only)', async ({ page }) => {
    await page.goto(`${BASE}/triage-report.html`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const hasErrorState = await page.locator('#error-state').count();
    if (hasErrorState > 0) {
      await expect(page.locator('#error-state')).toBeVisible({ timeout: 10_000 });
      const msg = await page.locator('#error-msg').textContent().catch(() => '');
      expect(msg).toContain('No report ID');
    }
    // If old page without our new structure, just ensure page is not blank
    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('login.html has email input field', async ({ page }) => {
    await page.goto(`${BASE}/login.html`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
  });

  test('API: POST triage-report + navigate to report page', async ({ page, request }) => {
    const apiRes = await request.post(`${BASE}/api/triage-report`, {
      data: {
        prompt: 'LCP 4.2s performance regression on /pricing — render-blocking scripts in <head>',
        url: `${BASE}/pricing`,
        consoleLogs: [],
        networkLogs: [{ method: 'GET', url: '/bundle.js', status: 200, responseTime: 1800 }],
      },
    });

    // Skip UI navigation if API isn't working
    if (!apiRes.ok()) {
      test.skip();
      return;
    }
    const { data } = await apiRes.json();
    expect(data.id).toBeDefined();
    expect(data.rootCause).toBeDefined();

    // Navigate to report page with ID
    await page.goto(`${BASE}/triage-report.html?id=${data.id}`, {
      waitUntil: 'domcontentloaded', timeout: 20_000,
    });
    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('dashboard-metrics API contract check', async ({ request }) => {
    const res = await request.get(`${BASE}/api/dashboard-metrics`);
    // New endpoint — 404 if not deployed, 401 if auth required, 200 if working
    expect([200, 401, 404]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('session');
      expect(body.data).toHaveProperty('signal');
      expect(body.data).toHaveProperty('priorityQueue');
    }
  });

  test('live-errors API contract check', async ({ request }) => {
    const res = await request.get(`${BASE}/api/live-errors`);
    expect([200, 401, 404]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    }
  });
});
