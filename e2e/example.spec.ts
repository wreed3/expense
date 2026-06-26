import { test, expect } from '@playwright/test';

/**
 * Example E2E test to verify Playwright setup
 * This will be replaced with actual tests in Phase 4
 */
test.describe('Example E2E Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Expense Tracker/i);
  });

  test('should have a login page', async ({ page }) => {
    await page.goto('/');
    
    // Should show login form or redirect to login
    const loginButton = page.getByRole('button', { name: /login|sign in/i });
    await expect(loginButton).toBeVisible();
  });
});