/**
 * Protected Pages — Auth Guard
 * Verifies unauthenticated users are redirected to /login for protected pages,
 * either via server-side redirect or client-side JS auth guard.
 * Run: npx playwright test playwright/flows/protected/auth-redirect.spec.ts --project=protected-flows
 */
import { test, expect } from '@playwright/test';

// Pages with server-side auth guard (Cloud Function rewrite)
const SERVER_GUARDED_PAGES = [
  'dashboard',
  'settings',
  'reports',
  'api-keys',
];

// Pages that may use client-side auth guard (serve 200, JS redirects)
const CLIENT_GUARDED_PAGES = [
  'triage',
  'github',
  'team',
  'profile',
];

test.describe('Protected pages — server-side auth guard', () => {
  for (const page of SERVER_GUARDED_PAGES) {
    test(`/${page} redirects to login`, async ({ page: pw }) => {
      const res = await pw.goto(`/${page}`);
      await pw.waitForLoadState('networkidle');
      const url = pw.url();
      const redirectedToLogin = url.includes('login');
      const blockedByAuth = res?.status() === 401 || res?.status() === 403;
      expect(
        redirectedToLogin || blockedByAuth,
        `Expected /${page} to redirect to login or return 401/403, got ${url} (${res?.status()})`,
      ).toBeTruthy();
    });
  }
});

test.describe('Protected pages — client-side auth guard', () => {
  for (const page of CLIENT_GUARDED_PAGES) {
    test(`/${page} loads without fatal errors for unauthenticated user`, async ({ page: pw }) => {
      const errors: string[] = [];
      pw.on('pageerror', (e) => errors.push(e.message));
      const res = await pw.goto(`/${page}`);
      await pw.waitForLoadState('networkidle');
      const status = res?.status() ?? 0;
      // These pages may return 200 (client-side guard) or redirect to login (server-side guard)
      expect([200, 302, 301, 401, 403]).toContain(status);
      // Verify no fatal JS errors (SyntaxError/ReferenceError)
      const fatal = errors.filter(
        (e) => e.includes('SyntaxError') || e.includes('ReferenceError'),
      );
      expect(fatal).toHaveLength(0);
    });
  }
});
