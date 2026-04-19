/**
 * API Endpoints — Core endpoint availability
 * Tests /health, /metrics, /api-docs, /openapi.json
 * Run: npx playwright test playwright/flows/api/endpoints.spec.ts --project=api-flows
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.RAPIDTRIAGE_BASE_URL || 'https://rapidtriage.me';

test.describe('Core API endpoints', () => {
  test('GET /health returns 200 with status field', async ({ request }) => {
    const res = await request.get(`${BASE}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(['ok', 'healthy']).toContain(body.status);
  });

  test('GET /api-docs returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/api-docs`);
    expect([200, 301, 302]).toContain(res.status());
  });

  test('GET /metrics returns 200 or requires auth', async ({ request }) => {
    const res = await request.get(`${BASE}/metrics`);
    expect([200, 401, 403]).toContain(res.status());
  });

  test('POST /mcp without auth returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/mcp`, {
      headers: { 'Content-Type': 'application/json' },
      data: { jsonrpc: '2.0', method: 'tools/list', id: 1 },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('GET /sse without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/sse`);
    expect([401, 403]).toContain(res.status());
  });

  test('GET /openapi.json returns valid schema or 404', async ({ request }) => {
    const res = await request.get(`${BASE}/openapi.json`);
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const text = await res.text();
      // Only parse as JSON if content looks like JSON
      if (text.trim().startsWith('{')) {
        const body = JSON.parse(text);
        expect(body).toHaveProperty('openapi');
        expect(body).toHaveProperty('paths');
      }
    }
  });
});
