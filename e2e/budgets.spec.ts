import { test, expect } from '@playwright/test';

test.describe('Budget Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/');
    await page.click('text=Sign Up');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Navigate to budgets page
    await page.click('text=Budgets');
  });

  test('should display empty state when no budgets exist', async ({ page }) => {
    await expect(page.locator('text=/no budgets/i')).toBeVisible();
  });

  test('should create a new budget', async ({ page }) => {
    await page.click('button:has-text("Add Budget")');
    
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/budget.*created/i')).toBeVisible();
    await expect(page.locator('text=Food')).toBeVisible();
    await expect(page.locator('text=$1,000.00')).toBeVisible();
  });

  test('should validate budget form', async ({ page }) => {
    await page.click('button:has-text("Add Budget")');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/category.*required/i')).toBeVisible();
    await expect(page.locator('text=/amount.*required/i')).toBeVisible();
  });

  test('should prevent duplicate budgets for same category and month', async ({ page }) => {
    // Create first budget
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    // Try to create duplicate
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1500.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/budget.*exists/i')).toBeVisible();
  });

  test('should display budget progress', async ({ page }) => {
    // Create budget
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    // Add expense to the category
    await page.click('text=Expenses');
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '250.00');
    await page.fill('input[name="description"]', 'Food shopping');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="date"]', '2024-01-15');
    await page.click('button[type="submit"]');
    
    // Go back to budgets
    await page.click('text=Budgets');
    
    // Should show progress
    await expect(page.locator('text=/25%/i')).toBeVisible();
    await expect(page.locator('text=\$250.00')).toBeVisible();
    await expect(page.locator('text=\$750.00')).toBeVisible(); // remaining
  });

  test('should show warning when approaching budget limit', async ({ page }) => {
    // Create budget with 80% alert threshold
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.fill('input[name="alertThreshold"]', '0.8');
    await page.click('button[type="submit"]');
    
    // Add expense that exceeds threshold
    await page.click('text=Expenses');
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '850.00');
    await page.fill('input[name="description"]', 'Large expense');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="date"]', '2024-01-15');
    await page.click('button[type="submit"]');
    
    // Go back to budgets
    await page.click('text=Budgets');
    
    // Should show warning
    await expect(page.locator('text=/approaching.*limit/i')).toBeVisible();
  });

  test('should show alert when over budget', async ({ page }) => {
    // Create budget
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    // Add expense that exceeds budget
    await page.click('text=Expenses');
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '1100.00');
    await page.fill('input[name="description"]', 'Over budget expense');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="date"]', '2024-01-15');
    await page.click('button[type="submit"]');
    
    // Go back to budgets
    await page.click('text=Budgets');
    
    // Should show over budget alert
    await expect(page.locator('text=/over budget/i')).toBeVisible();
    await expect(page.locator('text=/\$100\.00.*over/i')).toBeVisible();
  });

  test('should update budget', async ({ page }) => {
    // Create budget
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    // Edit budget
    await page.click('button[aria-label="Edit budget"]');
    await page.fill('input[name="amount"]', '1500.00');
    await page.click('button[type="submit"]:has-text("Update")');
    
    await expect(page.locator('text=/budget.*updated/i')).toBeVisible();
    await expect(page.locator('text=$1,500.00')).toBeVisible();
  });

  test('should delete budget', async ({ page }) => {
    // Create budget
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    // Delete budget
    await page.click('button[aria-label="Delete budget"]');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('text=/budget.*deleted/i')).toBeVisible();
    await expect(page.locator('text=/no budgets/i')).toBeVisible();
  });

  test('should filter budgets by month', async ({ page }) => {
    // Create budgets for different months
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Transport' });
    await page.fill('input[name="amount"]', '500.00');
    await page.fill('input[name="month"]', '2024-02');
    await page.click('button[type="submit"]');
    
    // Filter by January
    await page.fill('input[name="monthFilter"]', '2024-01');
    
    await expect(page.locator('text=Food')).toBeVisible();
    await expect(page.locator('text=Transport')).not.toBeVisible();
  });

  test('should display budget summary', async ({ page }) => {
    // Create multiple budgets
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select[name="category"]', { label: 'Transport' });
    await page.fill('input[name="amount"]', '500.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    // Should show total budget
    await expect(page.locator('text=/total.*\$1,500\.00/i')).toBeVisible();
  });
});