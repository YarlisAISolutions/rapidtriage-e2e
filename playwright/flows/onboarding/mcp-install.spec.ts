/**
 * Onboarding: MCP package availability and install flow
 */
import { test, expect } from '@playwright/test';

test.describe('Onboarding — MCP Package', () => {
  test('@rapidtriageme/mcp exists on npm', async ({ request }) => {
    const res = await request.get('https://registry.npmjs.org/@rapidtriageme%2Fmcp');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('@rapidtriageme/mcp');
  });

  test('@rapidtriageme/mcp version is >= 2.1.0', async ({ request }) => {
    const res = await request.get('https://registry.npmjs.org/@rapidtriageme%2Fmcp/latest');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const [major, minor] = body.version.split('.').map(Number);
    expect(major * 100 + minor).toBeGreaterThanOrEqual(201);
  });

  test('@rapidtriageme/mcp has mcp keyword', async ({ request }) => {
    const res = await request.get('https://registry.npmjs.org/@rapidtriageme%2Fmcp/latest');
    const body = await res.json();
    expect(body.keywords).toContain('mcp');
  });

  test('@rapidtriageme/mcp homepage points to rapidtriage.me', async ({ request }) => {
    const res = await request.get('https://registry.npmjs.org/@rapidtriageme%2Fmcp/latest');
    const body = await res.json();
    expect(body.homepage).toContain('rapidtriage');
  });

  test('rapidtriage.me is reachable', async ({ request }) => {
    const res = await request.get('https://rapidtriage.me');
    expect(res.status()).toBe(200);
  });

  test.skip('staging site is reachable', async ({ request }) => {
    // Hardcoded Firebase preview URL expires; re-enable with a live staging target.
    const res = await request.get('https://rapidtriage-me--staging-hb55sy3z.web.app');
    expect(res.status()).toBe(200);
  });
});
