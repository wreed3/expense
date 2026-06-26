import { test, expect } from '@playwright/test';

test.describe('Expense Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/');
    await page.click('text=Sign Up');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Navigate to expenses page
    await page.click('text=Expenses');
  });

  test('should display empty state when no expenses exist', async ({ page }) => {
    await expect(page.locator('text=/no expenses/i')).toBeVisible();
  });

  test('should create a new expense', async ({ page }) => {
    // Click add expense button
    await page.click('button:has-text("Add Expense")');
    
    // Fill in expense form
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Coffee and snacks');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="date"]', '2024-01-15');
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Add")');
    
    // Should show success message
    await expect(page.locator('text=/expense.*added/i')).toBeVisible();
    
    // Should display the new expense
    await expect(page.locator('text=Coffee and snacks')).toBeVisible();
    await expect(page.locator('text=$50.00')).toBeVisible();
  });

  test('should validate expense form', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=/amount.*required/i')).toBeVisible();
    await expect(page.locator('text=/description.*required/i')).toBeVisible();
  });

  test('should reject negative amount', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    
    await page.fill('input[name="amount"]', '-50');
    await page.fill('input[name="description"]', 'Test');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/amount.*positive/i')).toBeVisible();
  });

  test('should edit an existing expense', async ({ page }) => {
    // Create an expense first
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Original description');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.click('button[type="submit"]');
    
    // Wait for expense to appear
    await expect(page.locator('text=Original description')).toBeVisible();
    
    // Click edit button
    await page.click('button[aria-label="Edit expense"]');
    
    // Update the expense
    await page.fill('input[name="amount"]', '75.00');
    await page.fill('input[name="description"]', 'Updated description');
    await page.click('button[type="submit"]:has-text("Update")');
    
    // Should show updated expense
    await expect(page.locator('text=Updated description')).toBeVisible();
    await expect(page.locator('text=$75.00')).toBeVisible();
    await expect(page.locator('text=Original description')).not.toBeVisible();
  });

  test('should delete an expense', async ({ page }) => {
    // Create an expense
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'To be deleted');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=To be deleted')).toBeVisible();
    
    // Delete the expense
    await page.click('button[aria-label="Delete expense"]');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Should show success message
    await expect(page.locator('text=/expense.*deleted/i')).toBeVisible();
    
    // Expense should be removed
    await expect(page.locator('text=To be deleted')).not.toBeVisible();
  });

  test('should filter expenses by category', async ({ page }) => {
    // Create expenses in different categories
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Food expense');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.click('button[type="submit"]');
    
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '30.00');
    await page.fill('input[name="description"]', 'Transport expense');
    await page.selectOption('select[name="category"]', { label: 'Transport' });
    await page.click('button[type="submit"]');
    
    // Filter by Food category
    await page.selectOption('select[aria-label="Filter by category"]', { label: 'Food' });
    
    // Should only show food expense
    await expect(page.locator('text=Food expense')).toBeVisible();
    await expect(page.locator('text=Transport expense')).not.toBeVisible();
  });

  test('should filter expenses by date range', async ({ page }) => {
    // Create expenses on different dates
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'January expense');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="date"]', '2024-01-15');
    await page.click('button[type="submit"]');
    
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '30.00');
    await page.fill('input[name="description"]', 'February expense');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.fill('input[name="date"]', '2024-02-15');
    await page.click('button[type="submit"]');
    
    // Filter by January
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-01-31');
    await page.click('button:has-text("Apply Filter")');
    
    // Should only show January expense
    await expect(page.locator('text=January expense')).toBeVisible();
    await expect(page.locator('text=February expense')).not.toBeVisible();
  });

  test('should search expenses by description', async ({ page }) => {
    // Create multiple expenses
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Starbucks coffee');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.click('button[type="submit"]');
    
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '30.00');
    await page.fill('input[name="description"]', 'Uber ride');
    await page.selectOption('select[name="category"]', { label: 'Transport' });
    await page.click('button[type="submit"]');
    
    // Search for "coffee"
    await page.fill('input[placeholder="Search expenses..."]', 'coffee');
    
    // Should only show coffee expense
    await expect(page.locator('text=Starbucks coffee')).toBeVisible();
    await expect(page.locator('text=Uber ride')).not.toBeVisible();
  });

  test('should upload receipt for expense', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Expense with receipt');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    
    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'receipt.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image data'),
    });
    
    await page.click('button[type="submit"]');
    
    // Should show receipt indicator
    await expect(page.locator('[aria-label="Has receipt"]')).toBeVisible();
  });

  test('should create recurring expense', async ({ page }) => {
    await page.click('button:has-text("Add Expense")');
    
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Monthly subscription');
    await page.selectOption('select[name="category"]', { label: 'Entertainment' });
    
    // Enable recurring
    await page.check('input[name="isRecurring"]');
    await page.selectOption('select[name="frequency"]', { label: 'Monthly' });
    
    await page.click('button[type="submit"]');
    
    // Should show recurring indicator
    await expect(page.locator('[aria-label="Recurring expense"]')).toBeVisible();
  });

  test('should display expense statistics', async ({ page }) => {
    // Create multiple expenses
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Expense 1');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.click('button[type="submit"]');
    
    await page.click('button:has-text("Add Expense")');
    await page.fill('input[name="amount"]', '75.00');
    await page.fill('input[name="description"]', 'Expense 2');
    await page.selectOption('select[name="category"]', { label: 'Food' });
    await page.click('button[type="submit"]');
    
    // Should show total and count
    await expect(page.locator('text=/total.*\$125\.00/i')).toBeVisible();
    await expect(page.locator('text=/2.*expenses/i')).toBeVisible();
  });
});