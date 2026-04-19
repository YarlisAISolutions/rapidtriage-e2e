/**
 * Login Flow — rapidtriage.me/login.html
 * Feature: Firebase Auth email/password + SSO
 * Run: npx playwright test playwright/flows/auth/login.spec.ts --project=auth-flows
 * Update: only edit this file when login.html UI changes
 */

import { test, expect } from '../../fixtures/base';
import { Selectors } from '../../helpers/selectors';

const LOGIN_URL = '/login.html';

test.describe('Login flow', () => {

  test('unauthenticated user reaches login page', async ({ page }) => {
    await test.step('navigate to login', async () => {
      await page.goto(LOGIN_URL);
      await page.waitForLoadState('networkidle');
    });
    await test.step('verify login page loaded', async () => {
      await expect(page).toHaveURL(/login/);
      await expect(page.locator('h1, h2, .title, .login-title').first()).toBeVisible();
    });
  });

  test('login page shows email field', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await test.step('verify email input', async () => {
      await expect(page.locator(Selectors.auth.emailInput)).toBeVisible({ timeout: 10_000 });
    });
  });

  test('login page shows password field', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await test.step('verify password input', async () => {
      await expect(page.locator(Selectors.auth.passwordInput)).toBeVisible({ timeout: 10_000 });
    });
  });

  test('login page shows SSO buttons', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await test.step('verify Google SSO button', async () => {
      await expect(page.locator(Selectors.auth.googleSSOButton)).toBeVisible();
    });
  });

  test('invalid credentials show error', async ({ page }) => {
    test.skip(!process.env.TEST_EMAIL, 'Set TEST_EMAIL to run auth tests');
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await test.step('fill invalid credentials', async () => {
      await page.locator(Selectors.auth.emailInput).fill('wrong@example.com');
      await page.locator(Selectors.auth.passwordInput).fill('wrongpassword123');
    });
    await test.step('submit login form', async () => {
      await page.locator(Selectors.auth.loginButton).click();
    });
    await test.step('verify error shown', async () => {
      await expect(page.locator(Selectors.auth.errorMessage)).toBeVisible({ timeout: 10_000 });
    });
  });

  test('empty submit shows validation', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForLoadState('networkidle');
    await test.step('click submit without filling fields', async () => {
      await page.locator(Selectors.auth.loginButton).click();
    });
    await test.step('verify validation or error visible', async () => {
      // HTML5 validation or custom error — either is acceptable
      const hasError = await page.locator(Selectors.auth.errorMessage).isVisible().catch(() => false);
      const emailInvalid = await page.locator(Selectors.auth.emailInput).evaluate(
        (el: HTMLInputElement) => !el.validity.valid
      ).catch(() => false);
      expect(hasError || emailInvalid, 'Expected form validation or error message').toBeTruthy();
    });
  });

});
