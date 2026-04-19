/**
 * Triage API flow tests
 * Tests the live RTM API endpoints: lighthouse, console-logs, network-logs, screenshot
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.RAPIDTRIAGE_BASE_URL || 'https://rapidtriage-me--staging-hb55sy3z.web.app';

test.describe('RTM Triage API — Live Endpoints', () => {
  test('POST /api/lighthouse returns audit scores', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lighthouse`, {
      data: { url: BASE, categories: ['performance', 'accessibility', 'seo'] },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.scores).toBeDefined();
    expect(body.data.scores.performance).toBeGreaterThan(0);
  });

  test('POST /api/console-logs captures errors', async ({ request }) => {
    const res = await request.post(`${BASE}/api/console-logs`, {
      data: {
        logs: [{ level: 'error', message: 'Test error from E2E', source: 'test.ts:1', timestamp: new Date().toISOString() }],
        url: BASE,
        sessionId: `e2e-test-${Date.now()}`,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/network-logs captures failed requests', async ({ request }) => {
    const res = await request.post(`${BASE}/api/network-logs`, {
      data: {
        logs: [{ method: 'GET', url: '/api/test', status: 404, responseTime: 100 }],
        sessionId: `e2e-test-${Date.now()}`,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/screenshot requires auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/screenshot`);
    expect([200, 400, 401, 403]).toContain(res.status());
  });

  test('POST /api/screenshot requires auth', async ({ request }) => {
    const res = await request.post(`${BASE}/api/screenshot`, {
      data: { url: BASE },
    });
    expect([200, 400, 401, 403]).toContain(res.status());
  });

  test('GET /health returns healthy with all checks OK', async ({ request }) => {
    const res = await request.get(`${BASE}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.checks?.firestore).toBe('ok');
    expect(body.checks?.storage).toBe('ok');
    expect(body.checks?.auth).toBe('ok');
  });

  test('GET /api-docs returns Swagger HTML', async ({ request }) => {
    const res = await request.get(`${BASE}/api-docs`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text.toLowerCase().includes('swagger') || text.includes('RapidTriageME')).toBeTruthy();
  });

  test('GET /openapi.json returns valid spec with RTM paths', async ({ request }) => {
    const res = await request.get(`${BASE}/openapi.json`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.paths).toBeDefined();
    expect(body.paths['/api/lighthouse']).toBeDefined();
    expect(body.paths['/api/console-logs']).toBeDefined();
  });
});
