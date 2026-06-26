import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new user', async ({ page }) => {
    // Navigate to register page
    await page.click('text=Sign Up');
    
    // Fill in registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.click('text=Sign Up');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should reject weak password', async ({ page }) => {
    await page.click('text=Sign Up');
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/password.*strong/i')).toBeVisible();
  });

  test('should reject mismatched passwords', async ({ page }) => {
    await page.click('text=Sign Up');
    
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass123!');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/passwords.*match/i')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // First register a user
    await page.click('text=Sign Up');
    const email = `test${Date.now()}@example.com`;
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');
    
    // Login again
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Should be on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should reject login with invalid credentials', async ({ page }) => {
    await page.click('text=Sign In');
    
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Register and login
    await page.click('text=Sign Up');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should persist session after page reload', async ({ page }) => {
    // Register and login
    await page.click('text=Sign Up');
    const email = `test${Date.now()}@example.com`;
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator(`text=${email}`)).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});