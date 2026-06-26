import { test, expect } from '@playwright/test';

test.describe('Analytics and Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/');
    await page.click('text=Sign Up');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Create some test data
    await page.click('text=Expenses');
    
    // Add multiple expenses
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Add Expense")');
      await page.fill('input[name="amount"]', `${(i + 1) * 50}.00`);
      await page.fill('input[name="description"]', `Expense ${i + 1}`);
      await page.selectOption('select[name="category"]', { index: i % 3 });
      await page.fill('input[name="date"]', `2024-01-${(i + 1) * 5}`);
      await page.click('button[type="submit"]');
    }
    
    // Navigate to analytics
    await page.click('text=Analytics');
  });

  test('should display spending summary', async ({ page }) => {
    await expect(page.locator('text=/total spending/i')).toBeVisible();
    await expect(page.locator('text=/average expense/i')).toBeVisible();
    await expect(page.locator('text=/total expenses/i')).toBeVisible();
  });

  test('should display spending trend chart', async ({ page }) => {
    await expect(page.locator('[aria-label="Spending trends chart"]')).toBeVisible();
  });

  test('should display category breakdown', async ({ page }) => {
    await expect(page.locator('text=/spending by category/i')).toBeVisible();
    
    // Should show pie chart or bar chart
    await expect(page.locator('[aria-label="Category breakdown chart"]')).toBeVisible();
  });

  test('should filter analytics by date range', async ({ page }) => {
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-01-15');
    await page.click('button:has-text("Apply")');
    
    // Wait for charts to update
    await page.waitForTimeout(500);
    
    // Verify filtered data is displayed
    await expect(page.locator('text=/filtered/i')).toBeVisible();
  });

  test('should switch between chart types', async ({ page }) => {
    // Switch to bar chart
    await page.click('button[aria-label="Bar chart"]');
    await expect(page.locator('[aria-label="Bar chart view"]')).toBeVisible();
    
    // Switch to line chart
    await page.click('button[aria-label="Line chart"]');
    await expect(page.locator('[aria-label="Line chart view"]')).toBeVisible();
  });

  test('should display top spending categories', async ({ page }) => {
    await expect(page.locator('text=/top categories/i')).toBeVisible();
    
    // Should show ranked list
    await expect(page.locator('[aria-label="Top categories list"]')).toBeVisible();
  });

  test('should show monthly comparison', async ({ page }) => {
    await page.click('text=/monthly comparison/i');
    
    await expect(page.locator('[aria-label="Monthly comparison chart"]')).toBeVisible();
  });

  test('should export data to CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    
    await page.click('button:has-text("Export CSV")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/expenses.*\.csv/);
  });

  test('should generate PDF report', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    
    await page.click('button:has-text("Generate PDF")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/report.*\.pdf/);
  });

  test('should display insights and recommendations', async ({ page }) => {
    await page.click('text=Insights');
    
    await expect(page.locator('text=/spending patterns/i')).toBeVisible();
    await expect(page.locator('text=/recommendations/i')).toBeVisible();
  });

  test('should show year-over-year comparison', async ({ page }) => {
    await page.selectOption('select[name="comparisonPeriod"]', { label: 'Year over Year' });
    
    await expect(page.locator('[aria-label="Year comparison chart"]')).toBeVisible();
  });
});