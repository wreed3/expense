import { test, expect } from '@playwright/test';

test.describe('Category Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/');
    await page.click('text=Sign Up');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Navigate to categories
    await page.click('text=Categories');
  });

  test('should display default categories', async ({ page }) => {
    await expect(page.locator('text=Food')).toBeVisible();
    await expect(page.locator('text=Transport')).toBeVisible();
    await expect(page.locator('text=Entertainment')).toBeVisible();
  });

  test('should create a new category', async ({ page }) => {
    await page.click('button:has-text("Add Category")');
    
    await page.fill('input[name="name"]', 'Shopping');
    await page.fill('input[name="color"]', '#10b981');
    await page.fill('input[name="icon"]', '🛍️');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/category.*created/i')).toBeVisible();
    await expect(page.locator('text=Shopping')).toBeVisible();
    await expect(page.locator('text=🛍️')).toBeVisible();
  });

  test('should validate category form', async ({ page }) => {
    await page.click('button:has-text("Add Category")');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/name.*required/i')).toBeVisible();
    await expect(page.locator('text=/color.*required/i')).toBeVisible();
  });

  test('should prevent duplicate category names', async ({ page }) => {
    await page.click('button:has-text("Add Category")');
    
    await page.fill('input[name="name"]', 'Food');
    await page.fill('input[name="color"]', '#3b82f6');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/category.*exists/i')).toBeVisible();
  });

  test('should update category', async ({ page }) => {
    // Find and edit a category
    await page.click('button[aria-label="Edit Food category"]');
    
    await page.fill('input[name="name"]', 'Food & Dining');
    await page.fill('input[name="color"]', '#ef4444');
    
    await page.click('button[type="submit"]:has-text("Update")');
    
    await expect(page.locator('text=/category.*updated/i')).toBeVisible();
    await expect(page.locator('text=Food & Dining')).toBeVisible();
  });

  test('should delete category', async ({ page }) => {
    // Create a category to delete
    await page.click('button:has-text("Add Category")');
    await page.fill('input[name="name"]', 'Temporary');
    await page.fill('input[name="color"]', '#3b82f6');
    await page.click('button[type="submit"]');
    
    // Delete it
    await page.click('button[aria-label="Delete Temporary category"]');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('text=/category.*deleted/i')).toBeVisible();
    await expect(page.locator('text=Temporary')).not.toBeVisible();
  });

  test('should prevent deleting category with expenses', async ({ page }) => {
    // Add expense to Food category
    await page.click('text=Expenses');
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Test');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.click('button[type="submit"]');
    
    // Try to delete Food category
    await page.click('text=Categories');
    await page.click('button[aria-label="Delete Food category"]');
    
    await expect(page.locator('text=/cannot.*delete.*expenses/i')).toBeVisible();
  });

  test('should display category usage statistics', async ({ page }) => {
    // Add some expenses
    await page.click('text=Expenses');
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Test');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.click('button[type="submit"]');
    
    // Go back to categories
    await page.click('text=Categories');
    
    // Should show usage count
    await expect(page.locator('text=/1.*expense/i')).toBeVisible();
  });

  test('should use color picker for category color', async ({ page }) => {
    await page.click('button:has-text("Add Category")');
    
    // Click color input to open picker
    await page.click('input[name="color"]');
    
    // Color picker should be visible
    await expect(page.locator('[role="dialog"]:has-text("Color")')).toBeVisible();
  });
});