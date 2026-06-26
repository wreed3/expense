import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test.use({ ...devices['iPhone 12'] });

  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/');
    await page.click('text=Sign Up');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
  });

  test('should display mobile navigation menu', async ({ page }) => {
    // Mobile menu button should be visible
    const menuButton = page.locator('button[aria-label="Open menu"]');
    await expect(menuButton).toBeVisible();
    
    // Click to open menu
    await menuButton.click();
    
    // Menu items should be visible
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Expenses')).toBeVisible();
    await expect(page.locator('text=Budgets')).toBeVisible();
  });

  test('should render expense list in mobile view', async ({ page }) => {
    await page.click('text=Expenses');
    
    // Add an expense
    await page.click('button:has-text("Add")');
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Mobile expense');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.click('button[type="submit"]');
    
    // Expense card should be stacked vertically
    const expenseCard = page.locator('text=Mobile expense').locator('..');
    await expect(expenseCard).toBeVisible();
  });

  test('should display charts in mobile view', async ({ page }) => {
    await page.click('text=Analytics');
    
    // Charts should be responsive
    const chart = page.locator('[aria-label="Spending trends chart"]');
    await expect(chart).toBeVisible();
    
    // Chart should fit viewport width
    const chartBox = await chart.boundingBox();
    const viewport = page.viewportSize();
    expect(chartBox!.width).toBeLessThanOrEqual(viewport!.width);
  });

  test('should handle touch gestures for navigation', async ({ page }) => {
    // Swipe to open menu (if supported)
    await page.touchscreen.tap(10, 100);
    await page.touchscreen.tap(300, 100);
    
    // Menu should open
    await expect(page.locator('[role="navigation"]')).toBeVisible();
  });

  test('should display budget cards in mobile layout', async ({ page }) => {
    await page.click('text=Budgets');
    
    // Add budget
    await page.click('button:has-text("Add")');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="month"]', '2024-01');
    await page.click('button[type="submit"]');
    
    // Budget card should be full width
    const budgetCard = page.locator('text=Food').locator('..');
    const cardBox = await budgetCard.boundingBox();
    const viewport = page.viewportSize();
    expect(cardBox!.width).toBeGreaterThan(viewport!.width * 0.9);
  });

  test('should optimize form inputs for mobile', async ({ page }) => {
    await page.click('text=Expenses');
    await page.click('button:has-text("Add")');
    
    // Amount input should have numeric keyboard
    const amountInput = page.locator('input[name="amount"]');
    await expect(amountInput).toHaveAttribute('inputmode', 'decimal');
    
    // Date input should have date picker
    const dateInput = page.locator('input[name="date"]');
    await expect(dateInput).toHaveAttribute('type', 'date');
  });

  test('should handle bottom navigation on mobile', async ({ page }) => {
    // Bottom nav should be visible
    const bottomNav = page.locator('[aria-label="Bottom navigation"]');
    await expect(bottomNav).toBeVisible();
    
    // Should be fixed at bottom
    const navBox = await bottomNav.boundingBox();
    const viewport = page.viewportSize();
    expect(navBox!.y).toBeGreaterThan(viewport!.height - 100);
  });
});